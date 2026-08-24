import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { toast } from 'react-hot-toast';

export default function CodeBlock({ children, ...props }: ComponentProps<'pre'>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (copied) return;

    const code = extractCode(children);

    try {
      await navigator.clipboard.writeText(code);

      setCopied(true);
      toast.success('Code copied to clipboard');

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy code');

      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="group relative pb-3">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Code copied' : 'Copy code'}
        className={'p-2 bg-slate-800 absolute right-2 top-2 rounded-xl hover:bg-slate-700 duration-150'}
      >
        {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
}

function extractCode(node: React.ReactNode): string {
  if (node == null) {
    return '';
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractCode).join('');
  }

  if (typeof node === 'object' && 'props' in node) {
    const element = node as {
      props?: {
        children?: React.ReactNode;
      };
    };

    return extractCode(element.props?.children);
  }

  return '';
}
