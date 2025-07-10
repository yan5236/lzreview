import { jsonResponse, errorResponse, successResponse } from '../utils/response.js';

export async function handleWhitelist(request, db, env) {
  const url = new URL(request.url);
  const method = request.method;

  // 检查管理员权限
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !db.isValidAdmin(token)) {
    return errorResponse('需要管理员权限', 401);
  }

  try {
    switch (method) {
      case 'GET':
        return await getWhitelist(db);
      case 'POST':
        return await addToWhitelist(request, db);
      case 'DELETE':
        return await removeFromWhitelist(request, db);
      default:
        return errorResponse('不支持的请求方法', 405);
    }
  } catch (error) {
    console.error('Whitelist API Error:', error);
    return errorResponse('服务器内部错误', 500);
  }
}

async function getWhitelist(db) {
  try {
    const whitelist = await db.getWhitelist();
    return successResponse({ whitelist });
  } catch (error) {
    console.error('Get whitelist error:', error);
    return errorResponse('获取白名单失败');
  }
}

async function addToWhitelist(request, db) {
  try {
    const data = await request.json();
    const { domain, description } = data;

    if (!domain) {
      return errorResponse('域名不能为空');
    }

    await db.addToWhitelist(domain, description);
    return successResponse(null, '添加成功');
  } catch (error) {
    console.error('Add to whitelist error:', error);
    return errorResponse('添加失败');
  }
}

async function removeFromWhitelist(request, db) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id || isNaN(id)) {
      return errorResponse('无效的ID');
    }

    await db.removeFromWhitelist(parseInt(id));
    return successResponse(null, '删除成功');
  } catch (error) {
    console.error('Remove from whitelist error:', error);
    return errorResponse('删除失败');
  }
}