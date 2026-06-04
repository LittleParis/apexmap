export interface MapInfo {
  name: string;
  nameZh: string;
  image: string;
  startTime: number;
  endTime: number;
}

export interface MapMode {
  mode: string;
  modeName: string;
  modeNameZh: string;
  current: MapInfo;
  next: MapInfo[];
}

export interface MapRotationResponse {
  lastUpdated: string;
  modes: Record<string, MapMode>;
}
