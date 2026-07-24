package com.antgroup.antchain.fastdf.dataproxy.manager.connector.api

import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import com.antgroup.antchain.idata.rest.component.common.data.AbstractRestApiDataFetchAdaptor
import com.antgroup.antchain.idata.rest.component.common.model.FetchDataResultBO
import com.antgroup.antchain.idata.rest.component.common.model.RestApiDataSourceConfigBO
import com.antgroup.antchain.fastdf.dataproxy.manager.connector.api.relateObject.DatasetMetaTableSchemaFieldTypeEnum
import com.antgroup.antchain.fastdf.dataproxy.manager.connector.api.relateObject.ApiDatasetResponse
import com.antgroup.antchain.fastdf.dataproxy.manager.connector.api.relateObject.DatasetTableSchemaFieldData
import lombok.AllArgsConstructor
import lombok.Builder
import lombok.Data
import lombok.NoArgsConstructor
import okhttp3.*
import org.apache.commons.lang3.ObjectUtils

import javax.validation.constraints.NotBlank

/**
 * API数据源模板, DatasetDemo为class名称
 */
class DatasetDemo extends AbstractRestApiDataFetchAdaptor<DatasetRequest, ApiDatasetResponse> {

    DatasetDemo(OkHttpClient client, RestApiDataSourceConfigBO config) {
        super(client, config)
    }

    @Override
    Request.Builder createNewCall(DatasetRequest validatedCondition, String token) throws Exception {

        String url = "待用户补充完整"

        //根据实际用户请求的API类型构造http请求，以下为GET请求的构造方式
        HttpUrl.Builder urlBuilder = HttpUrl.parse(url)
                .newBuilder()
        if (!ObjectUtils.isEmpty(validatedCondition)) {
            urlBuilder.addQueryParameter("tenantId", validatedCondition.getTenantId())
        }
        return new Request.Builder()
                .url(urlBuilder.build())
                .get()


        //根据实际用户请求的API类型构造http请求，以下为POST请求的构造方式
        TreeMap<String, String> headerMap = new TreeMap<>()
        if (!org.springframework.util.ObjectUtils.isEmpty(validatedCondition)) {
            headerMap.put("Id", validatedCondition.getId())
        }
        RequestBody body = RequestBody.create(MediaType.parse("application/json"),
                JSONObject.toJSONString(headerMap));
        return new Request.Builder()
                .url(url)
                .post(body)
    }

    @Override
    protected FetchDataResultBO<ApiDatasetResponse> parseHttpResponse(DatasetRequest apiDatasetRequest, String body) {
        //根据实际用户请求的API返回结构,将data转为标准的ApiDatasetResponse
        //DatasetMetaTableSchemaFieldTypeEnum支持STRING/DOUBLE/INTEGER/BOOLEAN四种类型
        JSONObject res = JSONObject.parseObject(body)
        JSONArray data = res.getJSONArray("data")
        ApiDatasetResponse response = new ApiDatasetResponse()
        List<List<DatasetTableSchemaFieldData>> dataList = new ArrayList<>()
        for (int j = 0; j < data.size(); j++) {
            JSONObject dataJSONObject = data.getJSONObject(j)
            List<DatasetTableSchemaFieldData> datasetTableSchemaFieldDataList = new ArrayList<>()
            for (String str : dataJSONObject.keySet()) {
                DatasetTableSchemaFieldData datasetTableSchemaFieldData = new DatasetTableSchemaFieldData()
                datasetTableSchemaFieldData.setFieldName(str)
                datasetTableSchemaFieldData.setFieldType(DatasetMetaTableSchemaFieldTypeEnum.DOUBLE)
                datasetTableSchemaFieldData.setCurrentType(DatasetMetaTableSchemaFieldTypeEnum.DOUBLE)
                datasetTableSchemaFieldData.setCurrentValue(dataJSONObject.get(str))
                datasetTableSchemaFieldDataList.add(datasetTableSchemaFieldData)
            }
            dataList.add(datasetTableSchemaFieldDataList)
        }

        response.setDataList(dataList)
        response.setJsonResult(body)
        return FetchDataResultBO.success(response)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    static class DatasetRequest {
        //根据实际用户请求的API类型构造http请求，定义请求参数以及类型
        @NotBlank
        public String tenantId

        String getTenantId() {
            return tenantId
        }
        void setTenantId(String tenantId) {
            this.tenantId = tenantId
        }
    }
}
