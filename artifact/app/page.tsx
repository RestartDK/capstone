import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Page(): React.ReactElement {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-medium">Welcome to Daniel&apos;s capstone</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          dw this won&apos;t take too long and will be super thankful if you could do this favour for
          me&nbsp;;)
        </p>
      </div>
      <Button asChild>
        <Link href="/consent">Begin</Link>
      </Button>
    </div>
  );
}
