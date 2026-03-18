export interface ServiceConfig {
  baseUrl: string;
  hl?: string;
  bl?: string;
  f_sid?: string;
  at?: string;
  cookies?: string;
  origin?: string;
}

export interface Spec {
  rpcId: string;
  mapArgs: (data: any) => any[];
  mapResult: (arr: any[]) => any;
}
