public class PdcpApiIsvSigInterceptor implements Interceptor {
public static class PdcpApiSigHeaderKey {
/**
* 进⾏操作的租户 id，所有接⼝必填
*/
public static final String API_TENANT_ID_HEADER = "x-tenant-id";
/**
* 操作 trace id，非必填，不填时随机⽣成
*/
public static final String API_TRACE_ID_HEADER = "x-trace-id";
}
private static final String AUTHENTICATION_TYPE_HEADER_VALUE_ISV = "isv";
private static final String API_AUTH_VERSION_HEADER = "x-authentication-version";
private static final String API_AUTH_VERSION_HEADER_VALUE_1_0 = "1.0";
private static final String API_AUTH_TYPE_HEADER = "x-authentication-type";
private static final String API_SIGNATURE_METHOD_HEADER = "x-signature-method";
private static final String API_SIGNATURE_METHOD_HEADER_VALUE_SHA256_HMAC = "SHA256
_HMAC";
private static final String API_SIGNATURE_ISV_AK = "x-isv-ak";
private static final String API_SIGNATURE_HEADER = "x-signature";
private String isvAk;
private ByteString isvSk;
public PdcpApiIsvSigInterceptor(String isvAk, String isvSk) {
this.isvAk = isvAk;
this.isvSk = ByteString.encodeUtf8(isvSk);
}
@NotNull
@Override
public Response intercept(@NotNull Chain chain) throws IOException {
Request req = chain.request();
TreeMap<String, String> headerMap = new TreeMap<>();
String designatedTenantId =
req.header(PdcpApiSigHeaderKey.API_TENANT_ID_HEADER);
if (StringUtils.isNotBlank(designatedTenantId)) {
headerMap.put(PdcpApiSigHeaderKey.API_TENANT_ID_HEADER,
designatedTenantId);
}
headerMap.put(API_AUTH_VERSION_HEADER, API_AUTH_VERSION_HEADER_VALUE_1_0);
headerMap.put(API_AUTH_TYPE_HEADER, AUTHENTICATION_TYPE_HEADER_VALUE_ISV);
headerMap.put(API_SIGNATURE_METHOD_HEADER,
API_SIGNATURE_METHOD_HEADER_VALUE_SHA256_HMAC);
headerMap.put(API_SIGNATURE_ISV_AK, isvAk);
headerMap.put(API_SIGNATURE_HEADER, composeSignatureContent(headerMap,
req).hmacSha256(isvSk).base64());
return chain.proceed(
req.newBuilder().headers(Headers.of(headerMap)).build()
);
}
protected static ByteString composeSignatureContent(TreeMap<String, String> headerM
ap, Request req) throws IOException {
TreeMap<String, String> queryParamMap = new TreeMap<>();
for (String queryParamName : req.url().queryParameterNames()) {
queryParamMap.put(
queryParamName,
StringUtils.join(req.url().queryParameterValues(queryParamName), ",")
);
}
Buffer signContentBuffer = new Buffer().writeUtf8(req.url().encodedPath())
.writeUtf8(connectParamMap(headerMap))
.writeUtf8(connectParamMap(queryParamMap));
RequestBody reqBody = req.body();
if (reqBody != null) {
reqBody.writeTo(signContentBuffer);
}
return signContentBuffer.readByteString();
}
private static String connectParamMap(TreeMap<String, String> paramMap) {
List<String> items = new ArrayList<>();
for (Map.Entry<String, String> entry : paramMap.entrySet()) {
items.add(entry.getKey() + "=" + entry.getValue());
}
return StringUtils.join(items, "&");
}
}