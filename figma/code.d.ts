interface PluginMessage {
  type: string;
  payload: object;
}

interface GeenesColor {
  name: string;
  description: string;
  uid: string;
  rgb: RGB;
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