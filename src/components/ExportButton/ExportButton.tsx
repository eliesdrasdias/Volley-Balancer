import { useState, type RefObject } from "react";

interface ExportButtonProps {
  targetRef: RefObject<HTMLDivElement | null>;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("O navegador não conseguiu gerar a imagem.")), "image/jpeg", quality);
  });
}

export function ExportButton({ targetRef }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const exportImage = async () => {
    const target = targetRef.current;
    if (!target || exporting) return;
    setExporting(true);
    setError("");
    setSuccess("");
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(target, {
        backgroundColor: "#f8fafc",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      let blob = await canvasToBlob(canvas, 0.88);
      if (blob.size > 300 * 1024) blob = await canvasToBlob(canvas, 0.72);
      if (blob.size > 300 * 1024) {
        const smaller = document.createElement("canvas");
        smaller.width = Math.round(canvas.width * 0.75);
        smaller.height = Math.round(canvas.height * 0.75);
        const context = smaller.getContext("2d");
        if (!context) throw new Error("Não foi possível otimizar a imagem.");
        context.drawImage(canvas, 0, 0, smaller.width, smaller.height);
        blob = await canvasToBlob(smaller, 0.68);
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "times-volley-balancer.jpg";
      link.style.position = "fixed";
      link.style.left = "-9999px";
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Some browsers start reading the blob after the click handler returns.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSuccess("Imagem pronta para baixar.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao exportar os times. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  return <div className="mt-4">
    <button type="button" onClick={exportImage} disabled={exporting} className="min-h-11 w-full rounded-lg bg-accent-orange px-5 py-3 font-semibold text-white hover:bg-accent-orange/90 focus:outline-none focus:ring-2 focus:ring-accent-orange/40 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
      {exporting ? "Preparando imagem…" : "Exportar para Imagem"}
    </button>
    {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
    {success && <p className="mt-2 text-sm text-green-800" role="status">{success}</p>}
  </div>;
}
