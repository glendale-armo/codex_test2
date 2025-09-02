// @ts-nocheck
function App() {
    const [text, setText] = React.useState("");
    const handleFile = async (event) => {
        var _a, _b;
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const names = Object.keys(zip.files).filter((n) => n.endsWith(".xhtml") || n.endsWith(".html"));
        names.sort();
        let content = "";
        for (const name of names) {
            const fileData = await zip.files[name].async("string");
            const doc = new DOMParser().parseFromString(fileData, "application/xhtml+xml");
            content += (((_b = doc.body) === null || _b === void 0 ? void 0 : _b.textContent) || "") + "\n";
        }
        setText(content);
    };
    return (React.createElement('div', null, React.createElement('h1', null, 'EPUB Viewer'), React.createElement('input', { type: 'file', accept: '.epub', onChange: handleFile }), React.createElement('pre', { style: { whiteSpace: 'pre-wrap' } }, text)));
}
ReactDOM.render(React.createElement(App), document.getElementById('root'));
