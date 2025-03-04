import { determineCategoryWithRAG, determineCategoryWithAI } from './vectorDb';
import { catKeywords, transactionCategories } from './categories';


// Функция для определения категории на основе ключевых слов
function determineKeywordCategory(description: string): string {
  if (!description) return "";

  const lowerDesc = description.toLowerCase();
Object.entries(catKeywords).forEach(([group, keywords]) => {
  if(keywords.includes(lowerDesc)) return group
})

  return "";
}

// Основная функция определения категории
async function determineCategory(description: string): Promise<string> {
  if (!description) return "";

  try {
    // Сначала пробуем определить категорию с помощью AI
    // const aiCategory = await determineCategoryWithAI(description);
    
    // // Если AI вернул категорию, используем ее
    // if (aiCategory) {
    //   console.log(`AI определил категорию "${aiCategory}" для "${description}"`);
    //   return aiCategory;
    // }
    
    // Затем пробуем определить категорию с помощью RAG
    const ragCategory = await determineCategoryWithRAG(description);
    
    // Если RAG вернул категорию, используем ее
    if (ragCategory) {
      console.log(`RAG определил категорию "${ragCategory}" для "${description}"`);
    }
    // Иначе используем определение по ключевым словам
    const keywordCategory = determineKeywordCategory(description);

    return ragCategory || keywordCategory;

  } catch (error) {
    console.error('Ошибка при определении категории:', error);
    // В случае ошибки используем определение по ключевым словам
    return determineKeywordCategory(description);
  }
}

// Экспортируем категории и функции
export {
  transactionCategories,
  determineCategory,
  determineKeywordCategory
};
