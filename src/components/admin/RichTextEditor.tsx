import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link'],
  ['clean'],
];

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor .ql-toolbar {
          background: #F5F0E8;
          border: 1px solid #D1D5DB;
          border-radius: 8px 8px 0 0;
          font-family: inherit;
        }
        .rich-text-editor .ql-container {
          background: #fff;
          border: 1px solid #D1D5DB;
          border-top: none;
          border-radius: 0 0 8px 8px;
          font-family: inherit;
          font-size: 14px;
          min-height: 100px;
        }
        .rich-text-editor .ql-editor {
          min-height: 100px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9CA3AF;
          font-style: normal;
        }
        .rich-text-editor .ql-container:focus-within {
          border-color: #4A7C59;
          box-shadow: 0 0 0 2px rgba(74, 124, 89, 0.2);
        }
        .rich-text-editor .ql-toolbar:focus-within,
        .rich-text-editor .ql-container:focus-within ~ .ql-toolbar {
          border-color: #4A7C59;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={{ toolbar: TOOLBAR }}
      />
    </div>
  );
};

export default RichTextEditor;
