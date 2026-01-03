declare module '@google-cloud/vertexai' {
  export class VertexAI {
    constructor(opts?: { projectId?: string });
    getModel(name: string): {
      generate: (opts: {
        input?: string;
        temperature?: number;
        maxOutputTokens?: number;
      }) => Promise<any>;
    };
  }
  export default VertexAI;
}
