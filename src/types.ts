export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface PluginModule {
  id: string;
  name: string;
  description: string;
  getTools(): MCPToolDefinition[];
  handleToolCall(toolName: string, args: Record<string, any>): Promise<MCPToolResult>;
  handleHttpRequest?(url: URL, req: any, res: any): Promise<boolean>;
}
