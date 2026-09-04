import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { parsePensumWorkbook } from "@/lib/pensumParser";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (!isExcel) {
      setError("Solo se aceptan archivos Excel (.xlsx o .xls) — es el único formato que garantiza leer bien las tablas del pensum.");
      return;
    }
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const universityId = user?.universityId ?? null;
      const parsed = { ...(await parsePensumWorkbook(buffer)), universityId };
      if (parsed.quarters.length === 0) {
        setError("No se pudo leer la estructura del pensum en este archivo.");
        return;
      }
      navigate("/onboarding/import-review", { state: { parsed } });
    } catch {
      setError("No se pudo procesar el archivo. Verifica que sea un Excel (.xlsx) válido.");
    } finally {
      setIsProcessing(false);
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
        <p className="text-sm font-medium text-foreground">Arrastra tu pensum aquí</p>
        <p className="text-xs text-muted-foreground">o haz clic para seleccionar un archivo .xlsx</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Debe ser un archivo Excel — es el único formato compatible para leer correctamente las tablas del
          pensum.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isProcessing}
      >
        {isProcessing ? "Procesando…" : "Elegir archivo"}
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
