export function SideChat({ items, onClear }) {
    return React.createElement('div', { className: 'sidechat' }, React.createElement('div', { className: 'sidechat-header' }, React.createElement('button', { onClick: onClear }, 'Clear')), React.createElement('div', { className: 'sidechat-messages' }, items.map((it) => React.createElement('div', { key: it.id, className: `chat-item ${it.kind}` }, it.text))));
}
