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

        String url = 'https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/embed'

        // Create a JSON object for the request body
        JSONObject requestBody = new JSONObject()
        if (!ObjectUtils.isEmpty(validatedCondition) && !ObjectUtils.isEmpty(validatedCondition.getQuery())) {
            requestBody.put('query', validatedCondition.getQuery())
        }

        RequestBody body = RequestBody.create(MediaType.parse('application/json'),
                requestBody.toJSONString());

        // Create the request with required headers
        return new Request.Builder()
                .url(url)
                .post(body)
                .addHeader('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnenZrb25nZGpxaWlhbXpiYnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNjUyMzQsImV4cCI6MjA1NTk0MTIzNH0.PsZIcjAqexpqIg-91twpKjALyw9big6Bn4WRLLoCzTo')
                .addHeader('Content-Type', 'application/json')
                .addHeader('x_key', '1qaZ_Xsw2_Mju7');


        //根据实际用户请求的API类型构造http请求，以下为POST请求的构造方式
        // TreeMap<String, String> headerMap = new TreeMap<>()
        // if (!org.springframework.util.ObjectUtils.isEmpty(validatedCondition)) {
        //     headerMap.put('Id', validatedCondition.getId())
        // }
        // RequestBody body = RequestBody.create(MediaType.parse('application/json'),
        //         JSONObject.toJSONString(headerMap));
        // return new Request.Builder()
        //         .url(url)
        //         .post(body)
    }

    @Override
    protected FetchDataResultBO<ApiDatasetResponse> parseHttpResponse(DatasetRequest apiDatasetRequest, String body) {
        //根据实际用户请求的API返回结构,将data转为标准的ApiDatasetResponse
        //DatasetMetaTableSchemaFieldTypeEnum支持STRING/DOUBLE/INTEGER/BOOLEAN四种类型
        JSONObject res = JSONObject.parseObject(body)
        JSONArray data = res.getJSONArray('embedding')
        ApiDatasetResponse response = new ApiDatasetResponse()
        List<List<DatasetTableSchemaFieldData>> dataList = new ArrayList<>()
        
        // 处理embedding作为数组的情况
        List<DatasetTableSchemaFieldData> datasetTableSchemaFieldDataList = new ArrayList<>()
        for (int i = 0; i < data.size(); i++) {
            DatasetTableSchemaFieldData datasetTableSchemaFieldData = new DatasetTableSchemaFieldData()
            datasetTableSchemaFieldData.setFieldName("dimension_" + i)
            datasetTableSchemaFieldData.setFieldType(DatasetMetaTableSchemaFieldTypeEnum.DOUBLE)
            datasetTableSchemaFieldData.setCurrentType(DatasetMetaTableSchemaFieldTypeEnum.DOUBLE)
            datasetTableSchemaFieldData.setCurrentValue(data.get(i))
            datasetTableSchemaFieldDataList.add(datasetTableSchemaFieldData)
        }
        dataList.add(datasetTableSchemaFieldDataList)
        
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
        public String query  // Direct match with the API's expected parameter name

        String getQuery() {
            return query
        }

        void setQuery(String query){
          this.query = query
        }
    }
}