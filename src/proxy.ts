import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login"];
const ADMIN_ROUTES = ["/admin"];
const STUDENT_ROUTES = ["/browse", "/category", "/video"];

export default auth((req) => {
  // Em modo mock, desativa toda verificação de auth para permitir teste sem backend.
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    return NextResponse.next();
  }

  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isStudent = STUDENT_ROUTES.some((r) => pathname.startsWith(r));

  // Redireciona "/" para /browse ou /login
  if (pathname === "/") {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.user.role === "admin") return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.redirect(new URL("/browse", req.url));
  }

  // Rota pública: se já estiver logado, redireciona
  if (isPublic) {
    if (session) {
      const dest = session.user.role === "admin" ? "/admin" : "/browse";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Sem sessão: manda pro login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin tentando acessar área de aluno: permitido
  // Aluno tentando acessar área admin: bloqueado
  if (isAdmin && session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/browse", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"],
};
