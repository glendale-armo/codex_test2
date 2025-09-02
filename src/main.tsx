// @ts-nocheck

declare var React: any;
declare var ReactDOM: any;
declare var JSZip: any;

function App() {
  const [text, setText] = React.useState("");

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const names = Object.keys(zip.files).filter((n) => n.endsWith(".xhtml") || n.endsWith(".html"));
    names.sort();
    let content = "";
    for (const name of names) {
      const fileData = await zip.files[name].async("string");
      const doc = new DOMParser().parseFromString(fileData, "application/xhtml+xml");
      content += (doc.body?.textContent || "") + "\n";
    }
    setText(content);
  };

  return (
    React.createElement('div', null,
      React.createElement('h1', null, 'EPUB Viewer'),
      React.createElement('input', { type: 'file', accept: '.epub', onChange: handleFile }),
      React.createElement('pre', { style: { whiteSpace: 'pre-wrap' } }, text)
    )
  );
}

ReactDOM.render(React.createElement(App), document.getElementById('root'));
