import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { Provider } from 'ltijs';
import Database from 'ltijs-sequelize';
import { DataTypes } from 'sequelize';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 0. SAFETY CHECK
const requiredEnv = ['DB_NAME', 'DB_USER', 'DB_PASS', 'DB_HOST', 'LTI_KEY'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error('❌ CRITICAL ERROR: Missing environment variables in .env file:');
  console.error(`   ${missingEnv.join(', ')}`);
  console.error('   Please copy .env.example to .env and fill in your details.');
  process.exit(1);
}

// 1. SETUP DATABASE CONNECTION (MariaDB/MySQL)
// We use the "Database" class imported from ltijs-sequelize
const dbPlugin = new Database(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASS, 
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false
  }
);

// --- DEFINE DATABASE MODELS ---
// The plugin exposes the raw sequelize instance as .sequelize
const sequelize = dbPlugin.sequelize;

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  contextId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false
  }
});

// 2. CONFIGURE LTI PROVIDER
const lti = new Provider(process.env.LTI_KEY,
  { 
    plugin: dbPlugin 
  },
  {
    staticPath: path.join(__dirname, 'dist'),
    cookies: {
      secure: true,
      sameSite: 'None'
    }
  }
);

// CRITICAL FOR PRODUCTION: Trust the reverse proxy (Load Balancer)
lti.app.enable('trust proxy');

// 3. DEFINE ROUTES

// Health Check
lti.app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// LTI Launch (Standard)
lti.onConnect(async (token, req, res) => {
  return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// LTI Deep Linking Launch (Teacher selecting content)
lti.onDeepLinking(async (token, req, res) => {
  return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Root Route (Graceful Fallback)
lti.app.get('/', (req, res) => {
  return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// User Info Route - Now includes LTI Context
lti.app.get('/api/me', async (req, res) => {
  try {
    const token = res.locals.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // Check if this is a Deep Linking request (Teacher adding content)
    const isDeepLinking = token.platformContext.messageType === 'LtiDeepLinkingRequest';
    
    // Check if a specific activity was launched (Student viewing content)
    // We check req.query (from standard GET params) or custom params passed by LTI
    const activityId = req.query.activityId || token.platformContext.custom?.activityId;

    return res.json({
      name: token.userInfo.name,
      email: token.userInfo.email,
      roles: token.platformContext.roles,
      contextId: token.platformContext.context.id,
      isDeepLinking,
      activityId
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- DEEP LINKING API ---
lti.app.post('/api/deeplink', async (req, res) => {
  try {
    const token = res.locals.token;
    const { id, title } = req.body;

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // Construct the Deep Linking Response
    // We create a "LTI Resource Link" that points back to this tool with ?activityId=...
    const resource = {
      type: 'ltiResourceLink',
      title: title,
      url: `${process.env.LTI_URL || ('https://' + req.get('host'))}/?activityId=${id}`, 
      custom: {
        activityId: id // Redundant but safe
      },
      // Optional: grading support (lineItem) can be added here
    };

    const form = await lti.DeepLinking.createDeepLinkingForm(token, [resource], { message: 'Successfully added activity' });
    return res.send(form);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Deep linking failed' });
  }
});

// --- ACTIVITY API ROUTES ---

// GET: List all activities for the current course (Context)
lti.app.get('/api/activities', async (req, res) => {
  try {
    const token = res.locals.token;
    // If viewing a specific activity, we might fetch just that one, 
    // but typically the frontend handles filtering or we fetch all for the dashboard.
    // Ideally, for a student launch, we should just return the specific activity, 
    // but React handles the routing for now.
    
    const contextId = token.platformContext.context.id;
    
    const activities = await Activity.findAll({
      where: { contextId },
      order: [['updatedAt', 'DESC']]
    });
    
    return res.json(activities);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// POST: Create a new activity
lti.app.post('/api/activities', async (req, res) => {
  try {
    const token = res.locals.token;
    const contextId = token.platformContext.context.id;
    const { type, title, description, data } = req.body;

    const newActivity = await Activity.create({
      contextId,
      type,
      title,
      description,
      data
    });

    return res.json(newActivity);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create activity' });
  }
});

// PUT: Update an activity
lti.app.put('/api/activities/:id', async (req, res) => {
  try {
    const token = res.locals.token;
    const contextId = token.platformContext.context.id;
    const { id } = req.params;
    const { title, description, data } = req.body;

    const activity = await Activity.findOne({ where: { id, contextId } });
    
    if (!activity) return res.status(404).json({ error: 'Activity not found' });

    activity.title = title;
    activity.description = description;
    activity.data = data;
    await activity.save();

    return res.json(activity);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update activity' });
  }
});

// DELETE: Delete an activity
lti.app.delete('/api/activities/:id', async (req, res) => {
  try {
    const token = res.locals.token;
    const contextId = token.platformContext.context.id;
    const { id } = req.params;

    const deleted = await Activity.destroy({ where: { id, contextId } });
    
    if (!deleted) return res.status(404).json({ error: 'Activity not found' });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete activity' });
  }
});


// 4. START SERVER
const setup = async () => {
  try {
    await lti.deploy({ port: process.env.PORT || 3000 });
    
    // Sync Database Models (Create tables if they don't exist)
    await sequelize.sync(); 
    console.log('📦 Database synced');

    if (process.env.PLATFORM_URL && process.env.CLIENT_ID) {
      try {
        const platform = await lti.registerPlatform({
          url: process.env.PLATFORM_URL,
          name: 'Canvas',
          clientId: process.env.CLIENT_ID,
          authenticationEndpoint: process.env.AUTH_LOGIN_URL,
          accesstokenEndpoint: process.env.AUTH_TOKEN_URL,
          authConfig: { method: 'JWK_SET', key: process.env.KEY_SET_URL }
        });
        console.log('✅ Platform registered automatically:', await platform.platformName());
      } catch (e) {
        if (!e.message.includes('Platform already registered')) {
            console.warn('⚠️ Platform registration notice:', e.message);
        }
      }
    }
    
    console.log(`🚀 LTI Server listening on port ${process.env.PORT || 3000}`);
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

setup();