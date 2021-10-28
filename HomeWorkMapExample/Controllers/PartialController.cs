using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace HomeWorkMapExample.Controllers
{
    public class PartialController : Controller
    {
        public IActionResult NewEntry()
        {
            return PartialView();
        }

        public IActionResult ReadData()
        {
            return PartialView();
        }

        public IActionResult InfoData()
        {
            return PartialView();
        }

        public IActionResult ProjEntry()
        {
            return PartialView();
        }
        
        public IActionResult DataEntry()
        {
            return PartialView();
        }

        public IActionResult WktEntry()
        {
            return PartialView();
        }
    }
}
