import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Page(): React.ReactElement {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-medium">Research prototype</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dashboard task study (about 8 minutes). You will see consent and a short background form first.
        </p>
      </div>
      <Button asChild>
        <Link href="/consent">Begin</Link>
      </Button>
    </div>
  );
}
