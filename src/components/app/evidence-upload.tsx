// Evidence upload panel for the Input and Evidence Register.
// Files are held in the browser session only for this mockup: nothing is
// transmitted or stored, and attaching a file does not verify the artifact.
import { useRef, useState } from "react";
import { History as HistoryIcon, Paperclip, RotateCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { PermissionButton } from "@/components/app/permission";
import { StatusBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EvidenceArtifact, EvidenceState } from "@/demo-data/evidence-register";
import { evidenceStates } from "@/demo-data/evidence-register";
import {
  allowedExtensions,
  attachmentKinds,
  formatBytes,
  groupByLineage,
  lineageKey,
  maxUploadBytes,
  validateEvidenceFile,
  type AttachmentKind,
  type EvidenceAttachment,
} from "@/demo-data/evidence-uploads";
import { useDemoState } from "@/demo-data/store";

export function EvidenceUploadPanel({
  artifact,
  linkedState,
  reference,
}: {
  artifact: EvidenceArtifact;
  /** State selected in the recording sheet; the file is linked to it. */
  linkedState: EvidenceState;
  /** Reference typed in the recording sheet; the file is linked to it. */
  reference: string;
}) {
  const {
    attachmentsFor,
    attachEvidenceFile,
    removeEvidenceAttachment,
    rollbackEvidenceRevision,
  } = useDemoState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<AttachmentKind>("Authoritative document");
  const [stateLink, setStateLink] = useState<EvidenceState>(linkedState);
  const [note, setNote] = useState("");
  const [dragging, setDragging] = useState(false);
  const [openHistory, setOpenHistory] = useState<string[]>([]);

  const attachments = attachmentsFor(artifact.id);
  const lineages = groupByLineage(attachments);
  const targetLineage = lineageKey({
    artifactId: artifact.id,
    linkedState: stateLink,
    reference: reference.trim() || "Not recorded",
  });
  const existing = attachments.filter((a) => a.lineageId === targetLineage);
  const nextRevision =
    existing.reduce((max, a) => Math.max(max, a.revision), 0) + 1;
  const currentForSlot = existing.find((a) => a.status === "Current") ?? null;

  function pick(next: File | null | undefined) {
    if (!next) return;
    const rejection = validateEvidenceFile(next);
    if (rejection) {
      toast.error("File rejected", { description: rejection });
      return;
    }
    setFile(next);
  }

  function submit() {
    if (!file) {
      toast.error("Choose a file first");
      return;
    }
    if (!note.trim()) {
      toast.error(
        nextRevision > 1 ? "A change reason is required" : "A note is required",
        {
          description:
            nextRevision > 1
              ? "Explain what changed in this revision so the lineage stays reviewable."
              : "Describe what this file evidences so the register stays reviewable.",
        },
      );
      return;
    }
    const created = attachEvidenceFile({
      artifactId: artifact.id,
      file,
      kind,
      linkedState: stateLink,
      reference: reference.trim(),
      note: note.trim(),
    });
    if (!created) return;
    toast.success(
      created.revision > 1
        ? `${created.id} recorded as revision r${created.revision}`
        : `${created.id} attached to ${artifact.id}`,
      {
        description:
          created.revision > 1
            ? `Supersedes ${created.supersedesId} on the same artifact, state "${created.linkedState}" and reference ${created.reference}.`
            : `Linked to state "${stateLink}", level ${created.linkedLevel} and reference ${created.reference}.`,
      },
    );
    setFile(null);
    setNote("");
    setOpenHistory((prev) =>
      prev.includes(created.lineageId) ? prev : [...prev, created.lineageId],
    );
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Attach evidence file
        </p>
        <StatusBadge label={`${attachments.length} attached`} tone="neutral" />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center gap-2 rounded-md border border-dashed px-3 py-5 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-input bg-background"
        }`}
      >
        <Upload className="size-5 text-muted-foreground" aria-hidden />
        <p className="text-sm">
          {file ? (
            <span className="font-medium text-navy">
              {file.name} · {formatBytes(file.size)}
            </span>
          ) : (
            "Drop a file here or choose one"
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Allowed: {allowedExtensions.join(", ")} · limit {formatBytes(maxUploadBytes)}
        </p>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={allowedExtensions.map((e) => `.${e}`).join(",")}
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
          {file && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Attachment type</label>
          <Select value={kind} onValueChange={(v) => setKind(v as AttachmentKind)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {attachmentKinds.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Link to state</label>
          <Select value={stateLink} onValueChange={(v) => setStateLink(v as EvidenceState)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {evidenceStates.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Links to artifact {artifact.id} · level {artifact.level} · reference{" "}
        {reference.trim() || "not recorded yet"}
      </p>

      {currentForSlot ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-xs text-navy">
          This artifact, state and reference already holds{" "}
          <span className="font-medium">
            {currentForSlot.id} r{currentForSlot.revision}
          </span>{" "}
          ({currentForSlot.fileName}). Uploading now records revision r{nextRevision} and
          supersedes it; earlier revisions stay in the lineage.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          No file recorded for this slot yet — this upload becomes revision r1.
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="att-note" className="text-xs font-medium text-muted-foreground">
          {nextRevision > 1
            ? "What changed in this revision? (mandatory)"
            : "What does this file evidence? (mandatory)"}
        </label>
        <textarea
          id="att-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <PermissionButton permission="readiness.update" className="w-full" onClick={submit}>
        {nextRevision > 1 ? `Upload revision r${nextRevision}` : "Attach file to register"}
      </PermissionButton>

      {lineages.length > 0 && (
        <ul className="space-y-2">
          {lineages.map((revisions) => {
            const head = revisions[0]!;
            const history = revisions.slice(1);
            const expanded = openHistory.includes(head.lineageId);
            return (
              <li
                key={head.lineageId}
                className="rounded-md border border-border bg-background p-2.5"
              >
                <RevisionRow
                  attachment={head}
                  artifactId={artifact.id}
                  onDetach={removeEvidenceAttachment}
                  onRollback={rollbackEvidenceRevision}
                />
                {history.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 px-1 text-xs"
                      onClick={() =>
                        setOpenHistory((prev) =>
                          prev.includes(head.lineageId)
                            ? prev.filter((id) => id !== head.lineageId)
                            : [...prev, head.lineageId],
                        )
                      }
                    >
                      <HistoryIcon className="size-3.5" aria-hidden />
                      {expanded ? "Hide" : "Show"} {history.length} earlier revision
                      {history.length === 1 ? "" : "s"}
                    </Button>
                    {expanded && (
                      <ul className="mt-1 space-y-2 border-l-2 border-border pl-2.5">
                        {history.map((a) => (
                          <li key={a.id}>
                            <RevisionRow
                              attachment={a}
                              artifactId={artifact.id}
                              onDetach={removeEvidenceAttachment}
                              onRollback={rollbackEvidenceRevision}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RevisionRow({
  attachment: a,
  artifactId,
  onDetach,
  onRollback,
}: {
  attachment: EvidenceAttachment;
  artifactId: string;
  onDetach: (id: string, reason: string) => boolean;
  onRollback: (id: string, reason: string) => boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium text-navy">
          <Paperclip className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{a.fileName}</span>
          <StatusBadge
            label={`r${a.revision} · ${a.status}`}
            tone={a.status === "Current" ? "success" : "neutral"}
          />
        </p>
        <p className="text-xs text-muted-foreground">
          {a.id} · {a.kind} · {formatBytes(a.sizeBytes)} · {a.mimeType}
        </p>
        <p className="text-xs text-muted-foreground">
          Linked state {a.linkedState} · level {a.linkedLevel} · reference {a.reference}
        </p>
        <p className="text-xs text-muted-foreground">
          {a.uploadedBy} · {a.uploadedAt} · {a.checksum}
        </p>
        {a.supersedesId && (
          <p className="text-xs text-muted-foreground">Supersedes {a.supersedesId}</p>
        )}
        {a.supersededById && (
          <p className="text-xs text-muted-foreground">Superseded by {a.supersededById}</p>
        )}
        {a.reinstatedFromId && (
          <p className="text-xs text-muted-foreground">
            Reinstated by rollback from {a.reinstatedFromId} · {a.reinstatedBy} · {a.reinstatedAt}
          </p>
        )}
        {a.reinstatementReason && (
          <p className="text-xs text-muted-foreground">Rollback reason: {a.reinstatementReason}</p>
        )}
        <p className="mt-1 text-xs">{a.note}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {a.previewUrl && (
          <a
            href={a.previewUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-primary underline"
          >
            Open
          </a>
        )}
        {a.status === "Superseded" && (
          <PermissionButton
            permission="evidence.rollback"
            variant="outline"
            size="sm"
            onClick={() => {
              const reason = window.prompt(
                `Why is revision r${a.revision} being made current again?`,
                "",
              );
              if (reason === null) return;
              if (!reason.trim()) {
                toast.error("A rollback reason is required");
                return;
              }
              if (onRollback(a.id, reason.trim())) {
                toast.success(`${a.id} (r${a.revision}) is current again`, {
                  description: "Every revision stays in the lineage and the rollback is audited.",
                });
              }
            }}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Make current
          </PermissionButton>
        )}
        <PermissionButton
          permission="readiness.update"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (onDetach(a.id, `Detached revision r${a.revision} from ${artifactId}`)) {
              toast.success(`${a.id} (r${a.revision}) detached`);
            }
          }}
        >
          <Trash2 className="size-3.5" aria-hidden />
          Detach
        </PermissionButton>
      </div>
    </div>
  );
}
