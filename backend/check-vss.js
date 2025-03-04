async function checkVSS() {
  try {
    const sqliteVSS = await import('sqlite-vss');
    console.log('sqlite-vss module:', sqliteVSS);
    console.log('sqlite-vss default export:', sqliteVSS.default);
    console.log('sqlite-vss keys:', Object.keys(sqliteVSS));
    
    if (sqliteVSS.default) {
      console.log('sqlite-vss default keys:', Object.keys(sqliteVSS.default));
    }
  } catch (error) {
    console.error('Error importing sqlite-vss:', error);
  }
}

checkVSS(); 