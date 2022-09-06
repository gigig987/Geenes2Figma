interface PluginMessage {
  type: string;
  payload: object | string;
}

interface GeenesColor {
  name: string;
  description: string;
  uid: string;
  rgb: RGB;
  hex: string;
}

interface AddColorsPayload {
  lastUpdate: Date;
  id: string;
  colors: Array<GeenesColor>;
}

interface lastSynchDate {
  lastSynch: Date;
  id: string;
}