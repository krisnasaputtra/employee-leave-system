import { getServerEnv } from "@/lib/server-env";

export const dynamic = "force-dynamic";

export default function ConsentAgreementPage() {
  const consentAgreementUrl = getServerEnv().CONSENT_AGREEMENT_URL;

  return (
    <main className="flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div>
          <h1 className="font-semibold text-lg">Consent Agreement</h1>
          <p className="text-muted-foreground text-sm">Review and complete the agreement below.</p>
        </div>
        {consentAgreementUrl && (
          <a
            href={consentAgreementUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit rounded-md border px-3 py-2 font-medium text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open in a new tab
          </a>
        )}
      </header>

      <div className="min-h-0 flex-1 p-2 md:p-4">
        {consentAgreementUrl ? (
          <iframe
            src={consentAgreementUrl}
            title="Consent agreement"
            referrerPolicy="no-referrer"
            className="h-full w-full rounded-md border bg-white"
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-md border bg-muted/30 px-4 text-center">
            <div>
              <h2 className="font-medium">Agreement not available</h2>
              <p className="mt-1 text-muted-foreground text-sm">Please contact the administrator.</p>
            </div>
          </div>
        )}
      </div>

      <p className="shrink-0 border-t px-4 py-2 text-center text-muted-foreground text-xs">
        {consentAgreementUrl
          ? "If the agreement does not load, open it in a new tab and confirm you are connected to your organization’s network."
          : "The consent agreement has not been configured yet."}
      </p>
    </main>
  );
}
