try {
  eval('class __is_es6_class{}')
  eval('const __is_es6_arrow = ()=>{}')
  eval('`temp str`')
  eval('window?.property')
  eval('crypto.randomUUID()')
} catch (e) {
  document.body.innerHTML =
    '<div id="browser_compatibiliy_warning" style="text-align: center;">' +
    '<h1 class="title">Browser Error</h1>' +
    '<p>This app is not compatible with your browser.</p>' +
    '<p>Please use a recent version of a browser like Chrome, Firefox or Edge.</p>' +
    '</div>'
}
