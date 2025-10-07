export type ApiResponse<T> =
    | { success: true; data: T; meta?: Record<string, unknown> }
    | { success: false; error: { code: string; message: string; field?: string } };
