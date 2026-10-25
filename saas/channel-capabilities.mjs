// Registro de conectores previstos — nenhum token armazenado neste módulo.
// Status de conexões deve vir de backend da empresa, nunca ser assumido do ChatGPT.
export const CHANNELS=Object.freeze({
 instagram:{format:['reels','stories','carousel','feed'],api:'Meta Instagram API',requires:['business_or_creator','oauth','publish_scope'],enabled:false},
 facebook:{format:['reels','feed','video'],api:'Meta Graph API',requires:['managed_page','oauth','publish_scope'],enabled:false},
 tiktok:{format:['short','photo'],api:'TikTok Content Posting API',requires:['app_audit_for_public','oauth','video.publish','owner_consent'],enabled:false},
 youtube:{format:['short','long'],api:'YouTube Data API',requires:['oauth','youtube.upload','project_audit_for_public'],enabled:false},
 linkedin:{format:['feed','article','video'],api:'LinkedIn Posts API',requires:['oauth','organization_admin','w_organization_social'],enabled:false},
 x:{format:['text','video','image'],api:'X API',requires:['oauth','policy_review','approved_app'],enabled:false},
 pinterest:{format:['pin','video'],api:'Pinterest API',requires:['oauth','board_owner'],enabled:false},
 googleBusinessProfile:{format:['post','photo'],api:'Google Business Profile API',requires:['oauth','verified_business'],enabled:false}
});
export function validatePublicationDraft(draft,connection){
 const problems=[];
 if(!draft||!Object.hasOwn(CHANNELS,draft.platform))problems.push('channel_unsupported');
 if(typeof draft?.text!=='string'||draft.text.trim().length<3)problems.push('copy_missing');
 if(!draft?.originalRightsConfirmed)problems.push('rights_missing');
 if(!draft?.humanApproved)problems.push('human_review_missing');
 if(connection?.workspaceId!==draft?.workspaceId||!connection?.officialAccount)problems.push('official_account_not_verified_for_tenant');
 if(connection?.oauthValid!==true)problems.push('oauth_not_connected');
 if(connection?.apiPermissionApproved!==true)problems.push('api_permission_pending');
 if(draft?.platform==='tiktok'&&connection?.providerAuditComplete!==true)problems.push('tiktok_public_post_audit_pending');
 return {readyForAuthorizedAdapter:problems.length===0,hasRealPublisher:false,problems,
    note:'O contrato de adapter nao cria postagem; executar apenas com conector server-side homologado e webhook de confirmacao.'};
}
