import { GarmentType } from '@/types';

export interface MeasurementField {
  key: string;
  label: string;
  description: string;
  typical?: { min: number; max: number };
}

export interface MeasurementTemplate {
  type: GarmentType;
  label: string;
  icon: string;
  description: string;
  fields: MeasurementField[];
}

export const measurementTemplates: Record<GarmentType, MeasurementTemplate> = {
  SHIRT: {
    type: 'SHIRT',
    label: 'Shirt',
    icon: '👔',
    description: "Men's or women's shirt measurements",
    fields: [
      { key: 'neck', label: 'Neck', description: 'Around the base of the neck', typical: { min: 14, max: 19 } },
      { key: 'chest', label: 'Chest', description: 'Around the fullest part of the chest', typical: { min: 34, max: 52 } },
      { key: 'waist', label: 'Waist', description: 'Around the natural waistline', typical: { min: 28, max: 46 } },
      { key: 'shoulder', label: 'Shoulder', description: 'From shoulder point to shoulder point', typical: { min: 15, max: 22 } },
      { key: 'sleeveLength', label: 'Sleeve Length', description: 'From shoulder point to wrist', typical: { min: 22, max: 36 } },
      { key: 'bicep', label: 'Bicep', description: 'Around the fullest part of upper arm', typical: { min: 11, max: 18 } },
      { key: 'wrist', label: 'Wrist', description: 'Around the wrist bone', typical: { min: 6, max: 9 } },
      { key: 'shirtLength', label: 'Shirt Length', description: 'From base of neck to desired length', typical: { min: 26, max: 34 } },
    ],
  },
  TROUSERS: {
    type: 'TROUSERS',
    label: 'Trousers',
    icon: '👖',
    description: 'Pants and trousers measurements',
    fields: [
      { key: 'waist', label: 'Waist', description: 'Around the natural waistline', typical: { min: 28, max: 46 } },
      { key: 'hips', label: 'Hips', description: 'Around the fullest part of hips', typical: { min: 34, max: 52 } },
      { key: 'inseam', label: 'Inseam', description: 'From crotch to ankle', typical: { min: 26, max: 36 } },
      { key: 'outseam', label: 'Outseam', description: 'From waist to ankle (outer leg)', typical: { min: 38, max: 48 } },
      { key: 'thigh', label: 'Thigh', description: 'Around the fullest part of thigh', typical: { min: 20, max: 32 } },
      { key: 'knee', label: 'Knee', description: 'Around the knee', typical: { min: 14, max: 20 } },
      { key: 'legOpening', label: 'Leg Opening', description: 'Around the ankle/hem', typical: { min: 14, max: 22 } },
      { key: 'rise', label: 'Rise', description: 'From waistband to crotch seam', typical: { min: 9, max: 14 } },
    ],
  },
  SUIT: {
    type: 'SUIT',
    label: 'Suit',
    icon: '🤵',
    description: 'Full suit (jacket + trousers) measurements',
    fields: [
      { key: 'neck', label: 'Neck', description: 'Around the base of the neck', typical: { min: 14, max: 19 } },
      { key: 'chest', label: 'Chest', description: 'Around the fullest part of the chest', typical: { min: 34, max: 52 } },
      { key: 'waist', label: 'Waist', description: 'Around the natural waistline', typical: { min: 28, max: 46 } },
      { key: 'hips', label: 'Hips', description: 'Around the fullest part of hips', typical: { min: 34, max: 52 } },
      { key: 'shoulder', label: 'Shoulder', description: 'From shoulder point to shoulder point', typical: { min: 15, max: 22 } },
      { key: 'sleeveLength', label: 'Sleeve Length', description: 'From shoulder point to wrist', typical: { min: 22, max: 36 } },
      { key: 'jacketLength', label: 'Jacket Length', description: 'From base of collar to hem', typical: { min: 28, max: 34 } },
      { key: 'inseam', label: 'Inseam', description: 'From crotch to ankle', typical: { min: 26, max: 36 } },
      { key: 'outseam', label: 'Outseam', description: 'From waist to ankle (outer leg)', typical: { min: 38, max: 48 } },
      { key: 'thigh', label: 'Thigh', description: 'Around the fullest part of thigh', typical: { min: 20, max: 32 } },
    ],
  },
  DRESS: {
    type: 'DRESS',
    label: 'Dress',
    icon: '👗',
    description: "Women's dress measurements",
    fields: [
      { key: 'bust', label: 'Bust', description: 'Around the fullest part of the bust', typical: { min: 30, max: 48 } },
      { key: 'waist', label: 'Waist', description: 'Around the natural waistline', typical: { min: 24, max: 42 } },
      { key: 'hips', label: 'Hips', description: 'Around the fullest part of hips', typical: { min: 32, max: 50 } },
      { key: 'shoulder', label: 'Shoulder', description: 'From shoulder point to shoulder point', typical: { min: 13, max: 18 } },
      { key: 'bustPoint', label: 'Bust Point', description: 'From shoulder to bust point', typical: { min: 8, max: 13 } },
      { key: 'armhole', label: 'Armhole', description: 'Around the armhole opening', typical: { min: 14, max: 20 } },
      { key: 'dressLength', label: 'Dress Length', description: 'From shoulder to desired hem', typical: { min: 35, max: 60 } },
      { key: 'skirtLength', label: 'Skirt Length', description: 'From waist to hem', typical: { min: 18, max: 45 } },
    ],
  },
  SKIRT: {
    type: 'SKIRT',
    label: 'Skirt',
    icon: '🩱',
    description: 'Skirt measurements',
    fields: [
      { key: 'waist', label: 'Waist', description: 'Around the natural waistline', typical: { min: 24, max: 42 } },
      { key: 'hips', label: 'Hips', description: 'Around the fullest part of hips', typical: { min: 32, max: 50 } },
      { key: 'skirtLength', label: 'Skirt Length', description: 'From waist to hem', typical: { min: 16, max: 45 } },
      { key: 'hipDepth', label: 'Hip Depth', description: 'From waist to fullest hip point', typical: { min: 7, max: 10 } },
    ],
  },
  BLOUSE: {
    type: 'BLOUSE',
    label: 'Blouse',
    icon: '👚',
    description: "Women's blouse measurements",
    fields: [
      { key: 'bust', label: 'Bust', description: 'Around the fullest part of the bust', typical: { min: 30, max: 48 } },
      { key: 'waist', label: 'Waist', description: 'Around the natural waistline', typical: { min: 24, max: 42 } },
      { key: 'shoulder', label: 'Shoulder', description: 'From shoulder point to shoulder point', typical: { min: 13, max: 18 } },
      { key: 'sleeveLength', label: 'Sleeve Length', description: 'From shoulder point to wrist', typical: { min: 20, max: 32 } },
      { key: 'armhole', label: 'Armhole', description: 'Around the armhole opening', typical: { min: 14, max: 20 } },
      { key: 'blouseLength', label: 'Blouse Length', description: 'From shoulder to hem', typical: { min: 22, max: 30 } },
    ],
  },
  JACKET: {
    type: 'JACKET',
    label: 'Jacket',
    icon: '🧥',
    description: 'Jacket/blazer measurements',
    fields: [
      { key: 'chest', label: 'Chest', description: 'Around the fullest part of the chest', typical: { min: 34, max: 52 } },
      { key: 'waist', label: 'Waist', description: 'Around the natural waistline', typical: { min: 28, max: 46 } },
      { key: 'shoulder', label: 'Shoulder', description: 'From shoulder point to shoulder point', typical: { min: 15, max: 22 } },
      { key: 'sleeveLength', label: 'Sleeve Length', description: 'From shoulder point to wrist', typical: { min: 22, max: 36 } },
      { key: 'bicep', label: 'Bicep', description: 'Around the fullest part of upper arm', typical: { min: 11, max: 18 } },
      { key: 'jacketLength', label: 'Jacket Length', description: 'From base of collar to hem', typical: { min: 26, max: 34 } },
    ],
  },
};

export const getMeasurementTemplate = (type: GarmentType): MeasurementTemplate => {
  return measurementTemplates[type];
};
