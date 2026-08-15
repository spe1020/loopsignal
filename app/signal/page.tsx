import { permanentRedirect } from "next/navigation";

export default function SignalRedirect() {
  permanentRedirect("/supply");
}
