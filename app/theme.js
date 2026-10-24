  // до первой отрисовки, чтобы не мигала светлая тема
  (function(){
    try{
      var t = localStorage.getItem('pmlc-theme');
      if(t) document.documentElement.setAttribute('data-theme', t);
    }catch(e){}
  })();
