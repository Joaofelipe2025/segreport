"use server";

import { headers } from "next/headers";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { emailValido } from "@/lib/auth/rules";
import { criarLimitador, origemDaRequisicao } from "@/lib/portal/limitador";

export interface EstadoDaNewsletter {
  status: "inicial" | "inscrito" | "erro";
  mensagem?: string;
}

/**
 * Cinco por hora por origem. Quem se inscreve uma vez não chega perto disso;
 * um laço chega na sexta tentativa.
 */
const limitador = criarLimitador({ cota: 5, janelaMs: 60 * 60 * 1000 });

/**
 * Inscrição na newsletter.
 *
 * O formulário existia sem `action`: o site prometia "curadoria diária no seu
 * e-mail" e o endereço ia para lugar nenhum. Pior do que não ter o campo, que
 * ao menos não promete.
 *
 * Usa a chave de serviço pelo mesmo motivo do envio de capa: a alternativa
 * era depender de política de RLS aplicada à mão. Aqui o alcance é ainda mais
 * estreito — uma linha em `newsletter_subscribers`, com e-mail validado.
 *
 * E-mail repetido responde SUCESSO, não erro: a coluna é única, e dizer "este
 * e-mail já está cadastrado" conta a um estranho quem assina o veículo.
 */
export async function inscreverNaNewsletter(
  _estado: EstadoDaNewsletter,
  dados: FormData
): Promise<EstadoDaNewsletter> {
  const email = String(dados.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!emailValido(email)) {
    return { status: "erro", mensagem: "Informe um e-mail válido." };
  }

  const origem = origemDaRequisicao(await headers());
  if (!limitador.permite(origem)) {
    return {
      status: "erro",
      mensagem: "Muitas tentativas deste endereço. Espere alguns minutos.",
    };
  }

  const admin = criarClienteAdmin();
  const { error } = await admin.from("newsletter_subscribers").insert({ email });

  // 23505 é violação de unicidade — já estava inscrito.
  if (error && error.code !== "23505") {
    console.error("[newsletter] insert:", error.message);
    return {
      status: "erro",
      mensagem: "Não foi possível inscrever agora. Tente de novo em instantes.",
    };
  }

  return {
    status: "inscrito",
    mensagem: "Pronto. A curadoria chega no seu e-mail.",
  };
}
