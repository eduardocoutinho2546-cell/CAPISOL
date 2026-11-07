// CAPISOL • passagem Comercial → Administrativo.
// Operação determinística e sem lançamento financeiro; nenhum disparo externo.
export const FONTE_VENDA = 'vendas_sistemas_registro';
export const FONTE_CARTAO = 'passagem_comercial_adm_v1';

export function idEncaminhamento(idVenda) {
  if (typeof idVenda !== 'string' || !/^VS_[a-f0-9-]{36}$/i.test(idVenda)) {
    throw new Error('ID de venda inválido para encaminhamento');
  }
  return 'ADM_' + idVenda;
}
export function vendaElegivel(row) {
  const d = row?.data;
  return Boolean(d && d.statusComercial === 'vendida' && d.conferido === true &&
    typeof d.cliente === 'string' && d.cliente.trim().length >= 2 &&
    Number.isFinite(Number(d.valorVendido)) && Number(d.valorVendido) > 0);
}
export function criarCartaoAdministrativo(row, usuario, agora = new Date().toISOString()) {
  if (!vendaElegivel(row)) throw new Error('Venda não confirmada: encaminhamento bloqueado');
  if (!usuario || typeof usuario !== 'string') throw new Error('Usuário autenticado obrigatório');
  const cliente = row.data.cliente.trim();
  const nome = ('Conferir contrato e documentação — ' + cliente).slice(0, 140);
  return {
    col: 'leads', id: idEncaminhamento(row.id),
    data: {
      nome, funil: 'operacional', etapa: 'A fazer', ordem: '1',
      fonte: FONTE_CARTAO, refVenda: row.id,
      entrega: 'Conferir contrato assinado, cadastro, financiamento/recebimento, aprovação de preço, documentação técnica e autorização humana para compra e instalação.',
      obs: 'Passagem comercial → administrativo. Não comprova recebimento, não aprova compra, não cria contrato e não gera comissão.',
      agente: 'fluxo-comercial-administrativo', criado: agora, criadoPor: usuario
    }
  };
}
export function resumirVendas(vendas, idsEncaminhados) {
  const ids = new Set(idsEncaminhados || []);
  let pendentes = 0, encaminhadas = 0, invalidas = 0;
  for (const r of vendas || []) {
    if (!vendaElegivel(r)) { invalidas++; continue; }
    if (ids.has(idEncaminhamento(r.id))) encaminhadas++;
    else pendentes++;
  }
  return {pendentes, encaminhadas, invalidas, total: (vendas || []).length};
}
