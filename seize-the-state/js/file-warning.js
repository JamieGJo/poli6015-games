// Plain (non-module) script, so it still runs when a page is opened straight from Finder.
// The game's own code is in JavaScript modules, which browsers refuse to load from file:// pages,
// so without this the page would look normal but nothing would work.
(function () {
  if (location.protocol !== 'file:') return;
  var box = document.createElement('div');
  box.setAttribute('role', 'alert');
  box.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;'
    + 'background:rgba(20,24,33,.92);color:#fff;font:16px/1.5 system-ui,sans-serif;padding:24px';
  box.innerHTML = '<div style="max-width:560px">'
    + '<h2 style="margin:0 0 10px;font-size:22px">This page needs the local server</h2>'
    + '<p style="margin:0 0 10px">It was opened straight from a file, and browsers block the game\'s code on file pages.</p>'
    + '<p style="margin:0 0 10px">In Finder, double-click <b>Start Seize the State.command</b> in the <code>simulation</code> folder. '
    + 'It starts the server and opens the game at <b>http://localhost:8642</b>.</p>'
    + '<p style="margin:0;opacity:.75;font-size:14px">Or, in Terminal, from the POLI6015 folder: <code>python3 simulation/dev/serve.py</code>, then open http://localhost:8642.</p>'
    + '</div>';
  document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(box); });
})();
