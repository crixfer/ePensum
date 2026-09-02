import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { parsePensumWorkbook } from "@/lib/pensumParser";
import { Button } from "@/components/ui/button";

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parsePensumWorkbook(buffer);
      if (parsed.quarters.length === 0) {
        setError("No se pudo leer la estructura del pensum en este archivo.");
        return;
      }
      navigate("/onboarding/import-review", { state: { parsed } });
    } catch {
      setError("No se pudo procesar el archivo. Verifica que sea un Excel (.xlsx) válido.");
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        isDragging ? "border-primary bg-accent" : "border-border"
      }`}
    >
      <Upload className="size-6 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium text-foreground">Arrastra tu pensum en Excel aquí</p>
        <p className="text-xs text-muted-foreground">o haz clic para seleccionar un archivo .xlsx</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        Elegir archivo
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
