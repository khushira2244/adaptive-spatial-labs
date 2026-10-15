using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace AdaptiveSpatialLabs.Core.Networking
{
    public static class JsonCodec
    {
        private static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver(),
            NullValueHandling = NullValueHandling.Include,
            DateParseHandling = DateParseHandling.None,
            TypeNameHandling = TypeNameHandling.None
        };
        public static string Serialize(object value) => JsonConvert.SerializeObject(value, Settings);
        public static T Deserialize<T>(string json) => JsonConvert.DeserializeObject<T>(json, Settings);
        public static T Copy<T>(T value) => value == null ? default : Deserialize<T>(Serialize(value));
    }
}
