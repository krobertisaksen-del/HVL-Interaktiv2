export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  data: any;
  createdAt: string;
}

export interface PlayerProps {
  data: any;
  onSuccess?: (result: any) => void;
  compact?: boolean;
}

export interface Interaction {
  id: number | string;
  time: number;
  type: string;
  data: any;
  useHotspot?: boolean;
  x?: number;
  y?: number;
}
