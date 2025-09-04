// @ts-nocheck
import { explainSimple } from './ai/explain.js';
import { SideChat } from './components/SideChat.js';
const PAGE_SIZE = 1500;
function safeGetItem(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    }
    catch (_a) {
        return fallback;
    }
}
function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    }
    catch (_a) {
        /* ignore write errors */
    }
}
function splitIntoPages(doc, size) {
    var _a;
    const blocks = Array.from(((_a = doc.body) === null || _a === void 0 ? void 0 : _a.children) || []);
    const pages = [];
    let current = '';
    const pushPage = () => {
        if (current) {
            pages.push(current);
            current = '';
        }
    };
    const append = (html) => {
        if (current.length + html.length > size) {
            pushPage();
            current = html;
        }
        else {
            current += html;
        }
    };
    for (const block of blocks) {
        const tag = block.tagName ? block.tagName.toLowerCase() : '';
        const text = block.textContent || '';
        if (/^h[1-6]$/.test(tag)) {
            append(`<${tag}>${text.trim()}</${tag}>`);
            continue;
        }
        const words = text.trim().split(/\s+/);
        let paragraph = '';
        const flushParagraph = () => {
            if (!paragraph)
                return;
            append(`<p>${paragraph.trim()}</p>`);
            paragraph = '';
        };
        for (const word of words) {
            if ((paragraph + ' ' + word).trim().length > size) {
                flushParagraph();
                paragraph = word;
            }
            else {
                paragraph += (paragraph ? ' ' : '') + word;
            }
        }
        flushParagraph();
    }
    pushPage();
    return pages;
}
function App() {
    const [books, setBooks] = React.useState(() => safeGetItem('books', []));
    const [currentBook, setCurrentBook] = React.useState(null);
    const [currentChapter, setCurrentChapter] = React.useState(0);
    const [currentPage, setCurrentPage] = React.useState(0);
    const [fontSize, setFontSize] = React.useState(16);
    const [menuVisible, setMenuVisible] = React.useState(false);
    const [menuPos, setMenuPos] = React.useState({ x: 0, y: 0 });
    const [highlightTarget, setHighlightTarget] = React.useState(null);
    const [notes, setNotes] = React.useState([]);
    const [activeTab, setActiveTab] = React.useState('chapters');
    const [chatItems, setChatItems] = React.useState([]);
    const book = currentBook !== null ? books[currentBook] : null;
    const chapter = book ? book.chapters[currentChapter] : null;
    const page = chapter ? chapter.pages[currentPage] : '';
    const handleSelection = (event) => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
            setMenuPos({ x: event.clientX, y: event.clientY });
            setHighlightTarget(null);
            setMenuVisible(true);
        }
        else {
            setMenuVisible(false);
        }
    };
    const applyHighlight = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount) {
            const text = selection.toString();
            if (text) {
                const id = String(Date.now() + Math.random());
                setNotes((prev) => [...prev, { id, text }]);
            }
            selection.removeAllRanges();
            setMenuVisible(false);
        }
    };
    const onExplainSelected = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount) {
            const text = selection.toString().trim();
            if (text) {
                setMenuVisible(false);
                selection.removeAllRanges();
                setChatItems((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), kind: 'user', text },
                ]);
                explainSimple(text)
                    .then((ans) => setChatItems((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), kind: 'assistant', text: ans },
                ]))
                    .catch((e) => setChatItems((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        kind: 'assistant',
                        text: `Error: ${e.message}`,
                    },
                ]));
            }
        }
    };
    const handleHighlightClick = (event) => {
        const target = event.target;
        if (target && target.classList && target.classList.contains('highlight')) {
            setMenuPos({ x: event.clientX, y: event.clientY });
            setHighlightTarget(target);
            setMenuVisible(true);
            event.stopPropagation();
        }
    };
    const removeHighlight = () => {
        if (highlightTarget) {
            const id = highlightTarget.dataset.noteId;
            setNotes((prev) => prev.filter((n) => n.id !== id));
            setHighlightTarget(null);
            setMenuVisible(false);
        }
    };
    React.useEffect(() => {
        const hideMenu = () => {
            setMenuVisible(false);
            setHighlightTarget(null);
        };
        document.addEventListener('mousedown', hideMenu);
        return () => document.removeEventListener('mousedown', hideMenu);
    }, []);
    React.useEffect(() => {
        if (book) {
            setNotes(safeGetItem(`notes-${book.title}`, []));
        }
    }, [book]);
    React.useEffect(() => {
        if (book) {
            safeSetItem(`notes-${book.title}`, notes);
        }
    }, [notes, book]);
    React.useEffect(() => {
        safeSetItem('books', books);
    }, [books]);
    const handleFiles = async (event) => {
        const files = Array.from(event.target.files || []);
        const loaded = [];
        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            const names = Object.keys(zip.files).filter((n) => n.endsWith('.xhtml') || n.endsWith('.html'));
            names.sort();
            const chapters = [];
            for (const name of names) {
                const fileData = await zip.files[name].async('string');
                const doc = new DOMParser().parseFromString(fileData, 'application/xhtml+xml');
                const heading = doc.querySelector('h1, h2, h3');
                chapters.push({
                    title: heading ? heading.textContent : name.split('/').pop(),
                    pages: splitIntoPages(doc, PAGE_SIZE),
                });
            }
            let cover = '';
            const coverName = Object.keys(zip.files).find((n) => /cover\.(jpe?g|png|gif)$/i.test(n));
            if (coverName) {
                const ext = coverName.split('.').pop().toLowerCase();
                const data = await zip.files[coverName].async('base64');
                cover = `data:image/${ext};base64,${data}`;
            }
            loaded.push({
                title: file.name.replace(/\.epub$/i, ''),
                chapters,
                cover,
            });
        }
        setBooks((prev) => [...prev, ...loaded]);
        event.target.value = '';
    };
    const pageWithHighlights = React.useMemo(() => {
        let html = page;
        for (const n of notes) {
            const re = new RegExp(n.text.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'g');
            html = html.replace(re, `<span class="highlight" data-note-id="${n.id}">$&</span>`);
        }
        return html;
    }, [page, notes]);
    React.useEffect(() => {
        if (book) {
            safeSetItem(`progress-${book.title}`, {
                chapter: currentChapter,
                page: currentPage,
            });
        }
    }, [book, currentChapter, currentPage]);
    if (!book) {
        return React.createElement('div', null, React.createElement('h1', null, 'My Library'), React.createElement('input', { type: 'file', multiple: true, accept: '.epub', onChange: handleFiles }), React.createElement('ul', { className: 'library' }, books.map((b, i) => React.createElement('li', {
            key: i,
            onClick: () => {
                const progress = safeGetItem(`progress-${b.title}`, {});
                setCurrentBook(i);
                setCurrentChapter(progress.chapter || 0);
                setCurrentPage(progress.page || 0);
            },
        }, b.cover
            ? React.createElement('img', {
                src: b.cover,
                alt: `${b.title} cover`,
            })
            : null, React.createElement('span', null, b.title)))));
    }
    return React.createElement('div', { className: 'reader' }, React.createElement('div', { className: 'sidebar' }, React.createElement('button', {
        onClick: () => {
            setCurrentBook(null);
            setCurrentChapter(0);
            setCurrentPage(0);
            setActiveTab('chapters');
        },
    }, 'Back'), React.createElement('div', { className: 'tabs' }, React.createElement('button', {
        onClick: () => setActiveTab('chapters'),
        style: { fontWeight: activeTab === 'chapters' ? 'bold' : 'normal' },
    }, 'Chapters'), React.createElement('button', {
        onClick: () => setActiveTab('notes'),
        style: { fontWeight: activeTab === 'notes' ? 'bold' : 'normal' },
    }, 'Notes')), activeTab === 'chapters'
        ? React.createElement('ul', null, book.chapters.map((c, i) => React.createElement('li', {
            key: i,
            onClick: () => {
                setCurrentChapter(i);
                setCurrentPage(0);
            },
            style: { fontWeight: i === currentChapter ? 'bold' : 'normal', cursor: 'pointer', marginBottom: '0.5rem' },
        }, c.title)))
        : React.createElement('ul', { className: 'notes' }, notes.map((n) => React.createElement('li', { key: n.id }, n.text)))), React.createElement('div', { className: 'content' }, React.createElement('div', {
        className: 'page',
        style: { fontSize },
        dangerouslySetInnerHTML: { __html: pageWithHighlights },
        onMouseUp: handleSelection,
        onClick: handleHighlightClick,
    }), menuVisible
        ? React.createElement('div', {
            className: 'selection-menu',
            style: { top: menuPos.y, left: menuPos.x },
            onMouseDown: (e) => e.stopPropagation(),
        }, highlightTarget
            ? React.createElement('button', { onClick: removeHighlight }, 'Unhighlight')
            : React.createElement(React.Fragment, null, React.createElement('button', { onClick: applyHighlight }, 'Highlight'), React.createElement('button', { onClick: onExplainSelected }, 'Explain in simple terms')))
        : null, React.createElement('div', { className: 'controls' }, React.createElement('button', { onClick: () => setCurrentPage((p) => Math.max(p - 1, 0)), disabled: currentPage === 0 }, 'Prev'), React.createElement('span', null, `${currentPage + 1}/${chapter.pages.length}`), React.createElement('button', {
        onClick: () => setCurrentPage((p) => Math.min(p + 1, chapter.pages.length - 1)),
        disabled: currentPage >= chapter.pages.length - 1,
    }, 'Next'), React.createElement('button', { onClick: () => setFontSize((f) => Math.max(f - 2, 10)) }, 'A-'), React.createElement('button', { onClick: () => setFontSize((f) => f + 2) }, 'A+'))), React.createElement(SideChat, {
        items: chatItems,
        onClear: () => setChatItems([]),
    }));
}
ReactDOM.render(React.createElement(App), document.getElementById('root'));
