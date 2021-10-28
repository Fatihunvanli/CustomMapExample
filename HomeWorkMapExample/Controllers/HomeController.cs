using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using HomeWorkMapExample.Models;
using System.IO;
using Newtonsoft.Json;
using System.Text;
using Newtonsoft.Json.Linq;

namespace HomeWorkMapExample.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        public void SaveCoordinate(CoordinateInfo coordinateInfo)
        {
            coordinateInfo.createDate = Convert.ToDateTime(coordinateInfo.createDate).ToShortDateString();
            string path = Path.Combine(Directory.GetCurrentDirectory(), "CoordinateFile\\");
            var jsonData = System.IO.File.ReadAllText(path + "/coordinates.json");
            var coordinateList = JsonConvert.DeserializeObject<List<CoordinateInfo>>(jsonData)
                                  ?? new List<CoordinateInfo>();

            CoordinateInfo lastRecord = coordinateList.OrderByDescending(m => m.id).FirstOrDefault();
            coordinateInfo.id = lastRecord.id+1;

            coordinateList.Add(coordinateInfo);
            jsonData = JsonConvert.SerializeObject(coordinateList);
            System.IO.File.WriteAllText(path + "coordinates.json", jsonData);
        }

        public List<CoordinateInfo> GetData()
        {
            List<CoordinateInfo> result = new List<CoordinateInfo>();
            string path = Path.Combine(Directory.GetCurrentDirectory(), "CoordinateFile\\");
            var jsonData = System.IO.File.ReadAllText(path + "/coordinates.json");

            result = JsonConvert.DeserializeObject<List<CoordinateInfo>>(jsonData);

            return result;
        }

        public void DeleteRecord(int id)
        {
            string path = Path.Combine(Directory.GetCurrentDirectory(), "CoordinateFile\\");
            var jsonData = System.IO.File.ReadAllText(path + "/coordinates.json");
            var records = JsonConvert.DeserializeObject<List<CoordinateInfo>>(jsonData);

            records.RemoveAll(m => m.id == id);

            jsonData = JsonConvert.SerializeObject(records);
            System.IO.File.WriteAllText(path + "coordinates.json", jsonData);
        }

        public void UpdateRecord(CoordinateInfo coordinateInfo)
        {
            string path = Path.Combine(Directory.GetCurrentDirectory(), "CoordinateFile\\");
            var jsonData = System.IO.File.ReadAllText(path + "/coordinates.json");
            var records = JsonConvert.DeserializeObject<List<CoordinateInfo>>(jsonData);

            CoordinateInfo updatedRecord = records.Where(m => m.id == coordinateInfo.id).FirstOrDefault();

            updatedRecord.name = coordinateInfo.name;
            updatedRecord.createDate = coordinateInfo.createDate;
            updatedRecord.coordinate = coordinateInfo.coordinate;

            jsonData = JsonConvert.SerializeObject(records);
            System.IO.File.WriteAllText(path + "coordinates.json", jsonData);
        }

        public void SaveProjection(ProjectionInfo projectionInfo)
        {
            string path = Path.Combine(Directory.GetCurrentDirectory(), "CoordinateFile\\");
            var jsonData = System.IO.File.ReadAllText(path + "/projectionInfo.json");
            var projectionList = JsonConvert.DeserializeObject<List<ProjectionInfo>>(jsonData)
                                  ?? new List<ProjectionInfo>();


            projectionList.Add(projectionInfo);
            jsonData = JsonConvert.SerializeObject(projectionList);
            System.IO.File.WriteAllText(path + "projectionInfo.json", jsonData);
        }

        public List<ProjectionInfo> GetProjection(ProjectionInfo projectionInfo)
        {
            List<ProjectionInfo> result = new List<ProjectionInfo>();
            string path = Path.Combine(Directory.GetCurrentDirectory(), "CoordinateFile\\");
            var jsonData = System.IO.File.ReadAllText(path + "/projectionInfo.json");

            result = JsonConvert.DeserializeObject<List<ProjectionInfo>>(jsonData);

            return result;
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
