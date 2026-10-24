  // до первой отрисовки, чтобы не мигала светлая тема
  (function(){
    try{
      var t = localStorage.getItem('pmlc-theme') || 'dark'; if(t === 'auto') t = '';
      if(t) document.documentElement.setAttribute('data-theme', t);
    }catch(e){}
  })();
