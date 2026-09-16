export interface Server { id:string; name:string; subtitle:string; status:'online'|'soon'|'offline'|'unknown'; players:number|null; capacity:number|null; connectUrl:string; checkedAt?:string; sourceUpdatedAt?:string; statusMessage?:string; }
export interface NewsItem {id:string; title:string; category:string; image:string; body:string; isPlaceholder:boolean;}
export interface City {id:string; name:string; lat:number|null; lon:number|null; country?:'Україна'|'Румунія'; labelPoint?:{x:number;y:number}; locationNote?:string; description:string; image:string; position:string;}
