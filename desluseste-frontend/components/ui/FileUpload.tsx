// în interiorul FileUpload (sau ca wrapper în UploadCard)
<div
  className="card rounded-3xl p-6 sm:p-8"
>
  <div
    className="rounded-2xl border-2 border-dashed"
    style={{ borderColor: "rgba(148,163,184,.35)" }} // slate-400/35
  >
    <div className="px-6 py-10 sm:px-8 sm:py-12 text-center">
      {/* icon / text / input */}
      <p className="text-sm text-slate-300 mb-1">Trage fișierul PDF aici, sau fă click pentru a selecta</p>
      <p className="text-xs text-muted">PDF, max. 10MB</p>
    </div>
  </div>
</div>
