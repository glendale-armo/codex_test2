declare var React: any;

interface Item {
  id: string;
  kind: 'user' | 'assistant';
  text: string;
}

interface Props {
  items: Item[];
  onClear: () => void;
}

export function SideChat({ items, onClear }: Props) {
  return React.createElement(
    'div',
    { className: 'sidechat' },
    React.createElement(
      'div',
      { className: 'sidechat-header' },
      React.createElement('button', { onClick: onClear }, 'Clear')
    ),
    React.createElement(
      'div',
      { className: 'sidechat-messages' },
      items.map((it) =>
        React.createElement(
          'div',
          { key: it.id, className: `chat-item ${it.kind}` },
          it.text
        )
      )
    )
  );
}
