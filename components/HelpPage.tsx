import React from 'react';
import { Lightbulb, Clock, Target, Layers, Puzzle, CircleAlert, CircleCheck, Pencil, Eye, Download, ArrowRight, Link as LinkIcon, Layout } from 'lucide-react';

export const HelpPage = () => {
  const helpSections = [
    {
      title: 'Mengdetrening og Begrepskontroll',
      description: 'Best for rask sjekk av faktakunnskap og repetisjon.',
      color: 'bg-cyan-700', // Darker background for contrast
      items: [
        { name: 'Flervalg & Sant/Usant', desc: 'Bruk disse som "inngangsbillett" før synkron undervisning for å aktivere forkunnskaper, eller som repetisjon rett etterpå.' },
        { name: 'Minnespel', desc: 'Ypperlig for å drille terminologi. Koble fagbegrep med definisjon eller bilde.' }
      ]
    },
    {
      title: 'Prosess og Sammenheng',
      description: 'Hjelper studenten å forstå rekkefølge og relasjoner.',
      color: 'bg-indigo-700', // Darker background
      items: [
        { name: 'Tidslinje', desc: 'Vis utvikling over tid, historiske hendelser eller steg i en prosess.' },
        { name: 'Dra og Slipp', desc: 'Tvinger studenten å kategorisere informasjon. Pedagogisk tips: Be studenten sortere årsak og virkning, eller plasser elementer i riktig kontekst.' }
      ]
    },
    {
      title: 'Visuell Utforskning',
      description: 'Lar studenten oppdage informasjon i sitt eget tempo.',
      color: 'bg-rose-600', // Darker background
      items: [
        { name: 'Bilde Hotspot', desc: 'Perfekt for anatomi, utstyrsopplæring eller HMS (f.eks. finne feil i et rom). La studenten utforske bildet fritt før du gjennomgår teorien. Det skaper nysgjerrighet.' }
      ]
    },
    {
      title: 'Dybdelæring i Video',
      description: 'Gjør passiv titting til aktiv læring.',
      color: 'bg-red-700', // Darker background
      items: [
        { name: 'Interaktiv Video', desc: 'Videoer kan gjerne være lange når de er interaktive! Legg inn stoppunkter underveis for å "låse" kunnskapen og sikre at studenten henger med før de går videre.' }
      ]
    }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 space-y-12">
      {/* HERO */}
      <section className="text-center max-w-5xl mx-auto pt-8">
        <div className="w-28 h-28 bg-cyan-700 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-8 rotate-3">
          <Lightbulb className="text-white w-14 h-14" />
        </div>
        <h2 className="text-6xl font-bold text-slate-900 mb-8">Engasjerende Asynkron Undervisning</h2>
        <p className="text-3xl text-slate-800 leading-relaxed font-medium">
          Målet er at asynkron digital undervisning blir mer engasjerende for studenter, og at formativ vurdering kan være en del av dette.
        </p>
      </section>

      {/* DEFINITIONS */}
      <section className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-cyan-800 flex items-center gap-3 mb-6 text-3xl"><Clock size={36}/> Asynkron undervisning</h3>
          <p className="text-slate-800 text-2xl leading-relaxed font-medium">Undervisning som ikke skjer i sanntid. Studenten jobber med lærestoffet når det passer dem, typisk gjennom videoer, tekster og digitale oppgaver på en læringsplattform.</p>
        </div>
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-cyan-800 flex items-center gap-3 mb-6 text-3xl"><Target size={36}/> Formativ vurdering</h3>
          <p className="text-slate-800 text-2xl leading-relaxed font-medium">Vurdering <em>for</em> læring. Målet er ikke å sette karakter, men å gi studenten løpende tilbakemelding på hva de kan, og hva de må jobbe mer med underveis i læringsløpet.</p>
        </div>
      </section>

      {/* TOOLBOX */}
      <section>
        <h3 className="text-4xl font-bold text-slate-900 mb-10 text-center">Verktøykassen – Hva bør brukes når?</h3>
        <div className="grid md:grid-cols-2 gap-10">
          {helpSections.map((section) => (
            <div key={section.title} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className={`${section.color} p-8 text-white`}>
                <h4 className="font-bold text-3xl flex items-center gap-3">{section.title}</h4>
                <p className="text-white text-2xl mt-2 font-medium">{section.description}</p>
              </div>
              <div className="p-10 space-y-10">
                {section.items.map((item) => (
                  <div key={item.name}>
                    <h5 className="font-bold text-slate-900 mb-2 text-3xl">{item.name}</h5>
                    <p className="text-slate-800 text-2xl leading-relaxed font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FLERE SAMAN DEEP DIVE */}
      <section className="bg-gradient-to-br from-purple-50 to-indigo-50 p-12 rounded-3xl border border-purple-100 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <h3 className="text-4xl font-bold text-purple-900 mb-6 flex items-center gap-4"><Layers size={40} className="text-purple-700"/> Sammensatte Læringsstier ("Flere Saman")</h3>
            <p className="text-purple-900 mb-8 leading-relaxed text-2xl font-medium">
              Dette verktøyet lar deg sette sammen flere små aktiviteter til en lengre sekvens. I stedet for å gi studenten én gigantisk oppgave, deler du læringen opp i mindre biter.
            </p>
            <div className="space-y-6">
                <div className="flex gap-5 items-start">
                    <div className="bg-white p-3 rounded-lg shadow-sm text-purple-700 mt-1"><Puzzle size={32}/></div>
                    <div>
                        <h5 className="font-bold text-purple-900 text-3xl mb-2">Hvorfor mikro-læring?</h5>
                        <p className="text-purple-900 text-2xl font-medium">Store oppgaver kan virke overveldende ("Cognitive Load"). Ved å dele opp stoffet får studenten hyppigere mestringsfølelse og motivasjon til å fortsette.</p>
                    </div>
                </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 bg-white p-8 rounded-2xl shadow-sm border border-purple-100 rotate-2">
             <div className="space-y-4">
                 <div className="h-12 bg-slate-100 rounded w-full animate-pulse"></div>
                 <div className="h-32 bg-slate-50 rounded w-full border-2 border-dashed border-slate-200"></div>
                 <div className="h-12 bg-purple-100 rounded w-3/4"></div>
             </div>
             <p className="text-center text-base text-slate-500 mt-8 italic font-medium">Sett sammen video, quiz og bilder.</p>
          </div>
        </div>
      </section>

      {/* PEDAGOGICAL TIPS */}
      <section className="max-w-6xl mx-auto">
        <h3 className="text-4xl font-bold text-slate-900 mb-10 text-center">Pedagogiske Gullkorn</h3>
        <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-yellow-50 p-10 rounded-3xl border border-yellow-200">
                <h4 className="font-bold text-yellow-900 mb-4 flex items-center gap-3 text-3xl"><CircleAlert size={32} className="text-yellow-700"/> Feil er læring</h4>
                <p className="text-yellow-950 text-2xl leading-relaxed font-medium">
                    Appen gir nå tilbakemelding på feil svar. Oppfordre undervisere til å lage "gode" svaralternativer som avslører vanlige misoppfatninger. Det er når studenten svarer feil og får en forklaring (eller må prøve igjen) at læringen ofte skjer.
                </p>
            </div>
            <div className="bg-green-50 p-10 rounded-3xl border border-green-200">
                <h4 className="font-bold text-green-900 mb-4 flex items-center gap-3 text-3xl"><CircleCheck size={32} className="text-green-700"/> Krav om mestring</h4>
                <p className="text-green-950 text-2xl leading-relaxed font-medium">
                    Aktivitetene krever nå at studenten får alt riktig for å fullføre. Dette sikrer at de ikke bare klikker seg gjennom, men faktisk reflekterer over innholdet til de forstår det.
                </p>
            </div>
        </div>
      </section>

      {/* CANVAS EMBED GUIDE (NEW) */}
      <section className="bg-slate-800 text-white p-12 rounded-3xl border border-slate-700 max-w-6xl mx-auto mt-12">
        <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
                <h3 className="text-4xl font-bold flex items-center gap-4"><LinkIcon size={40} className="text-cyan-400"/> Tilgjengelig i Canvas-menyen?</h3>
                <p className="text-2xl text-slate-300 leading-relaxed font-medium">
                    Du kan legge dette verktøyet direkte inn i venstremenyen i Canvas (der "Hjem", "Moduler" osv. ligger) slik at kollegaer slipper å lete etter lenken.
                </p>
                <ol className="space-y-4 text-2xl text-slate-300 list-decimal list-inside font-medium marker:text-cyan-500 marker:font-bold">
                    <li>Gå til <strong>Innstillinger</strong> i Canvas-emnet (f.eks. "Lærerrommet").</li>
                    <li>Velg fanen <strong>Apper</strong> og søk etter <strong>Redirect Tool</strong> (ikon med blå pil).</li>
                    <li>Klikk <strong>Legg til app</strong>.</li>
                    <li>Fyll inn Navn: <em>HVL Interaktiv</em>.</li>
                    <li>Lim inn lenken til nettsiden (fra Vercel) i <strong>URL Redirect</strong>-feltet.</li>
                    <li><strong>Viktig:</strong> Kryss av for <em>Show in Course Navigation</em>.</li>
                </ol>
            </div>
             <div className="w-full md:w-1/3 bg-white/5 p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
                 <div className="bg-white p-4 rounded-xl mb-4">
                    <Layout size={48} className="text-slate-900"/>
                 </div>
                 <p className="text-sm text-slate-400 font-bold">Resultat: Verktøyet blir en integrert del av Canvas-rommet.</p>
             </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="border-t border-slate-200 pt-20">
          <h3 className="text-2xl font-bold text-slate-500 uppercase tracking-widest text-center mb-12">Arbeidsflyt for lærere</h3>
          <div className="flex flex-col md:flex-row justify-center gap-12 md:gap-24 items-center">
              <div className="text-center max-w-sm">
                  <div className="w-24 h-24 bg-white border-2 border-slate-200 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                      <Pencil size={40}/>
                  </div>
                  <h4 className="font-bold text-slate-900 text-3xl mb-3">1. Bygg</h4>
                  <p className="text-2xl text-slate-700 font-medium">Velg aktivitetstype og fyll inn innholdet ditt i verktøyet.</p>
              </div>
              <ArrowRight className="text-slate-300 hidden md:block" size={40} />
              <div className="text-center max-w-sm">
                  <div className="w-24 h-24 bg-white border-2 border-slate-200 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                      <Eye size={40}/>
                  </div>
                  <h4 className="font-bold text-slate-900 text-3xl mb-3">2. Test</h4>
                  <p className="text-2xl text-slate-700 font-medium">Bruk forhåndsvisningen for å se nøyaktig det studenten ser.</p>
              </div>
              <ArrowRight className="text-slate-300 hidden md:block" size={40} />
              <div className="text-center max-w-sm">
                  <div className="w-24 h-24 bg-white border-2 border-slate-200 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                      <Download size={40}/>
                  </div>
                  <h4 className="font-bold text-slate-900 text-3xl mb-3">3. Del</h4>
                  <p className="text-2xl text-slate-700 font-medium">Last opp filen i Canvas og bruk "Bygg inn"-knappen for å generere visningskode.</p>
              </div>
          </div>
      </section>
    </div>
  );
};