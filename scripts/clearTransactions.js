const db = require('../db');

const clearTransactions = () => {
    db.run('DELETE FROM transactions', (err) => {
        if (err) {
            console.error('Ошибка при очистке базы данных:', err.message);
        } else {
            console.log('База данных успешно очищена');
        }
        // Закрываем соединение с базой данных
        db.close((err) => {
            if (err) {
                console.error('Ошибка при закрытии базы данных:', err.message);
            }
            process.exit(0);
        });
    });
};

clearTransactions(); 