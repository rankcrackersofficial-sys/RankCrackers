export interface AITask {
  id: string;
  type: string;
  provider: string;
  payload: any;
  createdAt: number;
}
