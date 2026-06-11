import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon, Undo, Redo } from "lucide-react";
import { useEffect } from "react";

interface Props {
  valueHtml?: string;
  onChange: (html: string, json: unknown) => void;
}

export function RichTextEditor({ valueHtml, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
    ],
    content: valueHtml ?? "",
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[300px] p-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getJSON());
    },
  });

  useEffect(() => {
    if (editor && valueHtml !== undefined && editor.getHTML() !== valueHtml) {
      editor.commands.setContent(valueHtml || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueHtml]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    `h-8 w-8 p-0 ${active ? "bg-primary text-primary-foreground" : ""}`;

  return (
    <div className="border border-border bg-input/40">
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-card">
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive("link"))} onClick={() => {
          const url = window.prompt("URL");
          if (url === null) return;
          if (url === "") editor.chain().focus().unsetLink().run();
          else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}><LinkIcon className="h-4 w-4" /></Button>
        <div className="flex-1" />
        <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
