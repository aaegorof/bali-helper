# MCC Codes Reference для Deel Adapter

## Что такое MCC?

**Merchant Category Code (MCC)** - это четырехзначный код, который классифицирует бизнес по типу предоставляемых товаров или услуг. Используется платежными системами (Visa, Mastercard) для категоризации транзакций.

## Поддерживаемые MCC коды в адаптере

### 🍽️ Еда и напитки

| MCC | Категория | Примеры мерчантов |
|-----|-----------|-------------------|
| 5812 | Restaurants & Cafes | Кафе, рестораны, кофейни |
| 5814 | Fast Food | Фастфуд, пекарни, кондитерские |

### 🛒 Покупки

| MCC | Категория | Примеры мерчантов |
|-----|-----------|-------------------|
| 5499 | Grocery Stores | Продуктовые магазины, мини-маркеты |
| 5411 | Grocery Stores | Супермаркеты, гипермаркеты |
| 5310 | Online Shopping | Интернет-магазины (не Amazon) |
| 5942 | Books & Media | Книжные магазины, медиа |

### 💊 Здоровье и красота

| MCC | Категория | Примеры мерчантов |
|-----|-----------|-------------------|
| 5912 | Pharmacy | Аптеки, медикаменты |
| 7298 | Health & Beauty | Салоны, спа, массаж |

### ✈️ Путешествия

| MCC | Категория | Примеры мерчантов |
|-----|-----------|-------------------|
| 4722 | Travel & Accommodation | Airbnb, Booking.com, Agoda |
| 7011 | Hotels | Отели, гостиницы |
| 4511 | Airlines | Авиакомпании |

### 🏠 Дом и одежда

| MCC | Категория | Примеры мерчантов |
|-----|-----------|-------------------|
| 5712 | Furniture & Home | Мебель, товары для дома |
| 5691 | Clothing & Accessories | Одежда, аксессуары |
| 5947 | Gifts | Подарки, сувениры |

### 📱 Услуги и прочее

| MCC | Категория | Примеры мерчантов |
|-----|-----------|-------------------|
| 4814 | Telecom | Мобильная связь, интернет |
| 5817 | Digital Services | Wix, веб-сервисы |
| 7399 | Services | Различные услуги |
| 4899 | Utilities & Subscriptions | Netflix, подписки |
| 7929 | Entertainment | Развлечения |
| 5993 | Tobacco & Vape | Табак, вейпы |
| 5199 | Retail | Розничная торговля |

## Как добавить новый MCC код

Если вы видите транзакцию без категории, вы можете добавить её MCC код:

### 1. Найдите MCC код
Откройте CSV файл и найдите колонку `mcc` для нужной транзакции.

### 2. Определите категорию
Поищите значение MCC кода в интернете или используйте [официальный справочник Visa](https://www.visa.com/supplierlocator-app/app/#/home/supplier-locator).

### 3. Добавьте в адаптер
Откройте `deel-adapter.tsx` и добавьте в `MCC_CATEGORIES`:

```typescript
const MCC_CATEGORIES: Record<string, string> = {
  // ... существующие коды
  '5311': 'Department Stores', // ← добавьте здесь
};
```

### 4. Перезагрузите и тестируйте
Перезапустите приложение и попробуйте импортировать файл снова.

## Популярные MCC коды (не включенные)

Вот некоторые популярные MCC коды, которые вы можете добавить при необходимости:

| MCC | Описание |
|-----|----------|
| 5311 | Department Stores (универмаги) |
| 5541 | Service Stations (заправки) |
| 5732 | Electronics Stores |
| 7372 | Computer Programming |
| 7996 | Amusement Parks |
| 8011 | Doctors & Physicians |
| 8099 | Medical Services |
| 4121 | Taxi & Limousines |
| 5039 | Construction Materials |
| 5192 | Books, Periodicals, Newspapers |

## Транзакции без MCC

Некоторые типы транзакций не имеют MCC кода:
- **DEPOSIT** - Пополнения счета
- **WITHDRAWAL** - Снятия
- **FEE** - Комиссии
- **REFUND** (иногда) - Возвраты

Для них категория будет `null`, и вы можете присвоить её вручную в UI.

## Полезные ресурсы

- [Visa Supplier Locator](https://www.visa.com/supplierlocator-app/app/#/home/supplier-locator) - Официальный справочник MCC кодов Visa
- [Mastercard Merchant Category Codes](https://www.mastercard.us/en-us/business/overview/support/merchant-category-codes.html) - Справочник Mastercard
- [Wikipedia: Merchant Category Code](https://en.wikipedia.org/wiki/Merchant_category_code) - Общая информация

---

**Совет**: Начните с базовых категорий и добавляйте новые по мере необходимости, основываясь на ваших реальных транзакциях!

