import { Category } from '@/types/category';
import { categoryDB } from './indexedDB';

export interface OrganizedCategories {
  [section: string]: {
    [category: string]: string[];
  };
}

export const getCategoriesByType = async (type: 'income' | 'expense'): Promise<Category[]> => {
  const categories = await categoryDB.getAllCategories();
  return categories.filter(cat => cat.type === type);
};

export const organizeCategories = (categories: Category[]): OrganizedCategories => {
  const organizedData: OrganizedCategories = {};
  
  categories.forEach(category => {
    if (!organizedData[category.section]) {
      organizedData[category.section] = {};
    }
    
    if (!organizedData[category.section][category.category]) {
      organizedData[category.section][category.category] = [];
    }
    
    if (category.subcategory && !organizedData[category.section][category.category].includes(category.subcategory)) {
      organizedData[category.section][category.category].push(category.subcategory);
    }
  });
  
  return organizedData;
}; 