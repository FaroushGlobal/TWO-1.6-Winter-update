
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  property: string;
}

export type MainChoice = 'Onboarding (New-Hire)' | 'Existing Employee' | 'Signage (Coming Soon)' | '';
export type GeneralCategory = 'Polo Shirts' | 'Hats' | 'Beanies' | 'Fleece Jackets' | 'Winter Jackets' | 'Replacement ID-Badge' | '';
export type SignageType = 'Doormats' | 'Yard signs' | 'Banners' | '';
export type DoormatSize = '2x3' | '3x4' | '4x6' | '';
export type YardSignSize = '12x18in' | '18x24in' | '36x24in' | '';
export type BannerSize = '36in' | '48in' | '60in' | '';

export interface ItemData {
  id: number;
  mainChoice: MainChoice;
  
  // Onboarding Fields
  onboardingShirtSize: string;
  onboardingBadgePic: File[]; // FileUpload returns File[]
  onboardingStaffName: string;
  onboardingStaffTitle: string;
  onboardingBadgeGuidelinesVerified: boolean;
  
  // General Fields
  generalCategory: GeneralCategory;
  
  // Polo shirts
  poloQuantities: Record<string, string>;
  
  // Hoodie
  hoodieQuantities: Record<string, string>;

  // Winter Jacket
  winterJacketQuantities: Record<string, string>;
  
  // Hats
  hatQuantity: string;
  
  // Winter Beanie
  winterBeanieQuantity: string;
  winterBeanieStyle: 'Cuffed' | 'Cap' | '';
  
  // Replacement badge
  replacementBadgePic: File[];
  replacementStaffName: string;
  replacementStaffTitle: string;
  replacementBadgeGuidelinesVerified: boolean;
  
  // Signage
  signageType: SignageType;
  doormatSize: DoormatSize;
  yardSignSize: YardSignSize;
  bannerSize: BannerSize;
  signageQuantity: string;
}

export interface FormDataState {
  customerInfo: CustomerInfo;
  items: ItemData[];
}

