const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Item = require('./models/Item');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected for seeding"))
  .catch(err => console.log("❌ DB Connection Error:", err));

const dummyItems = [
  {
    type: "product",
    name: "Steel Chair Frame",
    hsn: "94017100",
    unit: "pieces",
    category: "Furniture Components",
    code: "SCF-001",
    salePrice: "450",
    salePriceTaxType: "without",
    saleDiscountType: "percentage",
    purchasePrice: "350",
    purchasePriceTaxType: "without",
    taxRate: "18%",
    openingQty: "100",
    atPrice: "350",
    asOfDate: new Date("2026-01-01"),
    minStock: "20",
    location: "Warehouse A - Shelf 3",
    currentStock: 100,
    processes: [
      {
        id: 1,
        stepName: "Metal Cutting",
        description: "Cut steel tubes to required dimensions",
        subSteps: [
          { id: 1, name: "Measure tubes", description: "Measure 80cm for legs", status: "pending" },
          { id: 2, name: "Cut with precision", description: "Use metal cutter", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Welding",
        description: "Weld frame components together",
        subSteps: [
          { id: 1, name: "Prepare joints", description: "Clean surfaces", status: "pending" },
          { id: 2, name: "Weld joints", description: "MIG welding", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 3,
        stepName: "Quality Test",
        description: "Test frame strength",
        subSteps: [],
        stepType: "testing",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "Steel Tube 25mm",
        quantity: "4",
        unit: "meters",
        costPerUnit: "80",
        supplier: "Metal Works Ltd",
        notes: "Grade 304 stainless steel",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "Welding Rod",
        quantity: "50",
        unit: "grams",
        costPerUnit: "2",
        supplier: "Weld Supply Co",
        notes: "ER308L type",
        usedInProcessStep: 2
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Dimension Check",
        description: "Verify all dimensions match specifications",
        checkType: "measurement",
        acceptanceCriteria: "Within ±2mm tolerance",
        status: "pending"
      },
      {
        id: 2,
        checkName: "Weld Quality",
        description: "Check weld strength and appearance",
        checkType: "visual",
        acceptanceCriteria: "No cracks, smooth finish",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Overall Dimensions",
      tolerance: "±2mm",
      inspectionImage: "",
      remarks: ""
    }
  },
  {
    type: "product",
    name: "Office Desk",
    hsn: "94033090",
    unit: "pieces",
    category: "Furniture",
    code: "OD-002",
    salePrice: "1200",
    salePriceTaxType: "with",
    saleDiscountType: "flat",
    purchasePrice: "900",
    purchasePriceTaxType: "without",
    taxRate: "18%",
    openingQty: "50",
    atPrice: "900",
    asOfDate: new Date("2026-01-01"),
    minStock: "10",
    location: "Warehouse B - Zone 2",
    currentStock: 50,
    processes: [
      {
        id: 1,
        stepName: "Wood Cutting",
        description: "Cut plywood to desk dimensions",
        subSteps: [
          { id: 1, name: "Mark cutting lines", description: "120cm x 60cm", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Assembly",
        description: "Assemble desk components",
        subSteps: [
          { id: 1, name: "Attach legs", description: "Screw in 4 legs", status: "pending" },
          { id: 2, name: "Install drawer", description: "Mount drawer rails", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "Plywood Sheet 18mm",
        quantity: "1",
        unit: "sheet",
        costPerUnit: "500",
        supplier: "Wood Industries",
        notes: "Marine grade plywood",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "Desk Legs",
        quantity: "4",
        unit: "pieces",
        costPerUnit: "60",
        supplier: "Hardware Supplies",
        notes: "Adjustable height legs",
        usedInProcessStep: 2
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Surface Finish",
        description: "Check for smooth surface",
        checkType: "visual",
        acceptanceCriteria: "No scratches or dents",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Desktop flatness",
      tolerance: "±1mm",
      inspectionImage: "",
      remarks: ""
    }
  },

  {
    type: "product",
    name: "LED Light Fixture",
    hsn: "94054090",
    unit: "pieces",
    category: "Electronics",
    code: "LED-004",
    salePrice: "800",
    salePriceTaxType: "with",
    saleDiscountType: "percentage",
    purchasePrice: "550",
    purchasePriceTaxType: "without",
    taxRate: "12%",
    openingQty: "75",
    atPrice: "550",
    asOfDate: new Date("2026-01-01"),
    minStock: "15",
    location: "Electronics Section",
    currentStock: 75,
    processes: [
      {
        id: 1,
        stepName: "Component Assembly",
        description: "Assemble LED components",
        subSteps: [
          { id: 1, name: "Solder LED strips", description: "Connect LED strips to PCB", status: "pending" },
          { id: 2, name: "Install driver", description: "Mount LED driver", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Electrical Testing",
        description: "Test electrical safety",
        subSteps: [
          { id: 1, name: "Power test", description: "Test at 220V", status: "pending" }
        ],
        stepType: "testing",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "LED Strip 5050",
        quantity: "2",
        unit: "meters",
        costPerUnit: "120",
        supplier: "LED Solutions Inc",
        notes: "Warm white 3000K",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "LED Driver 30W",
        quantity: "1",
        unit: "pieces",
        costPerUnit: "150",
        supplier: "Power Components",
        notes: "Input 220V AC",
        usedInProcessStep: 1
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Electrical Safety",
        description: "Check for electrical hazards",
        checkType: "functional",
        acceptanceCriteria: "No short circuits, proper grounding",
        status: "pending"
      },
      {
        id: 2,
        checkName: "Light Output",
        description: "Measure luminosity",
        checkType: "measurement",
        acceptanceCriteria: "Minimum 2400 lumens",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Power consumption",
      tolerance: "28-32W",
      inspectionImage: "",
      remarks: ""
    }
  },
  {
    type: "product",
    name: "Plastic Storage Box",
    hsn: "39231090",
    unit: "pieces",
    category: "Storage Solutions",
    code: "PSB-005",
    salePrice: "150",
    salePriceTaxType: "without",
    saleDiscountType: "percentage",
    purchasePrice: "90",
    purchasePriceTaxType: "without",
    taxRate: "18%",
    openingQty: "200",
    atPrice: "90",
    asOfDate: new Date("2026-01-01"),
    minStock: "50",
    location: "Warehouse C - Row 5",
    currentStock: 200,
    processes: [
      {
        id: 1,
        stepName: "Injection Molding",
        description: "Mold plastic boxes",
        subSteps: [
          { id: 1, name: "Heat plastic pellets", description: "Heat to 200°C", status: "pending" },
          { id: 2, name: "Inject into mold", description: "High pressure injection", status: "pending" },
          { id: 3, name: "Cool down", description: "Wait 2 minutes", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "PP Plastic Pellets",
        quantity: "500",
        unit: "grams",
        costPerUnit: "0.15",
        supplier: "Plastics Inc",
        notes: "Polypropylene grade",
        usedInProcessStep: 1
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Mold Quality",
        description: "Check for defects",
        checkType: "visual",
        acceptanceCriteria: "No warping, smooth edges",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Wall thickness",
      tolerance: "2-3mm",
      inspectionImage: "",
      remarks: ""
    }
  },
  {
    type: "product",
    name: "Aluminum Window Frame",
    hsn: "76109090",
    unit: "pieces",
    category: "Building Materials",
    code: "AWF-006",
    salePrice: "2500",
    salePriceTaxType: "without",
    saleDiscountType: "percentage",
    purchasePrice: "1800",
    purchasePriceTaxType: "without",
    taxRate: "18%",
    openingQty: "30",
    atPrice: "1800",
    asOfDate: new Date("2026-01-01"),
    minStock: "5",
    location: "Warehouse D - Zone 1",
    currentStock: 30,
    processes: [
      {
        id: 1,
        stepName: "Cutting & Drilling",
        description: "Cut aluminum profiles and drill holes",
        subSteps: [
          { id: 1, name: "Measure profiles", description: "Measure for window size", status: "pending" },
          { id: 2, name: "Cut to size", description: "Use aluminum saw", status: "pending" },
          { id: 3, name: "Drill mounting holes", description: "8mm holes at corners", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Assembly",
        description: "Assemble frame components",
        subSteps: [
          { id: 1, name: "Join corners", description: "Use corner brackets", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "Aluminum Profile 50x50mm",
        quantity: "8",
        unit: "meters",
        costPerUnit: "200",
        supplier: "Aluminum Traders",
        notes: "Anodized finish",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "Corner Brackets",
        quantity: "4",
        unit: "pieces",
        costPerUnit: "25",
        supplier: "Hardware Co",
        notes: "Stainless steel",
        usedInProcessStep: 2
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Corner Alignment",
        description: "Check 90-degree corners",
        checkType: "measurement",
        acceptanceCriteria: "All corners at 90° ±0.5°",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Frame squareness",
      tolerance: "±0.5°",
      inspectionImage: "",
      remarks: ""
    }
  },
  {
    type: "product",
    name: "Cotton T-Shirt",
    hsn: "61091000",
    unit: "pieces",
    category: "Garments",
    code: "CTS-007",
    salePrice: "350",
    salePriceTaxType: "with",
    saleDiscountType: "flat",
    purchasePrice: "180",
    purchasePriceTaxType: "without",
    taxRate: "12%",
    openingQty: "500",
    atPrice: "180",
    asOfDate: new Date("2026-01-01"),
    minStock: "100",
    location: "Garment Section - Rack 2",
    currentStock: 500,
    processes: [
      {
        id: 1,
        stepName: "Cutting",
        description: "Cut fabric patterns",
        subSteps: [
          { id: 1, name: "Lay fabric", description: "Spread fabric on cutting table", status: "pending" },
          { id: 2, name: "Mark patterns", description: "Mark front, back, sleeves", status: "pending" },
          { id: 3, name: "Cut fabric", description: "Cut along marked lines", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Sewing",
        description: "Stitch all components",
        subSteps: [
          { id: 1, name: "Sew shoulders", description: "Join front and back", status: "pending" },
          { id: 2, name: "Attach sleeves", description: "Sew sleeves to body", status: "pending" },
          { id: 3, name: "Hem finishing", description: "Finish bottom and sleeve hems", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "Cotton Fabric",
        quantity: "1.2",
        unit: "meters",
        costPerUnit: "120",
        supplier: "Textile Mills Ltd",
        notes: "180 GSM premium cotton",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "Thread",
        quantity: "50",
        unit: "meters",
        costPerUnit: "0.5",
        supplier: "Thread Supply Co",
        notes: "Polyester thread, matching color",
        usedInProcessStep: 2
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Stitch Quality",
        description: "Check stitch integrity",
        checkType: "visual",
        acceptanceCriteria: "No loose threads, uniform stitching",
        status: "pending"
      },
      {
        id: 2,
        checkName: "Size Verification",
        description: "Measure garment dimensions",
        checkType: "measurement",
        acceptanceCriteria: "Within size chart tolerance",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Overall finish",
      tolerance: "No defects",
      inspectionImage: "",
      remarks: ""
    }
  },
  {
    type: "product",
    name: "Stainless Steel Water Bottle",
    hsn: "73239390",
    unit: "pieces",
    category: "Household Items",
    code: "SSWB-008",
    salePrice: "600",
    salePriceTaxType: "without",
    saleDiscountType: "percentage",
    purchasePrice: "380",
    purchasePriceTaxType: "without",
    taxRate: "18%",
    openingQty: "150",
    atPrice: "380",
    asOfDate: new Date("2026-01-01"),
    minStock: "30",
    location: "Warehouse B - Section 4",
    currentStock: 150,
    processes: [
      {
        id: 1,
        stepName: "Body Formation",
        description: "Form bottle body from steel sheet",
        subSteps: [
          { id: 1, name: "Deep drawing", description: "Form cylinder shape", status: "pending" },
          { id: 2, name: "Trimming", description: "Trim excess material", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Assembly",
        description: "Attach cap and seal",
        subSteps: [
          { id: 1, name: "Thread cutting", description: "Cut threads for cap", status: "pending" },
          { id: 2, name: "Attach cap", description: "Fit threaded cap", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 3,
        stepName: "Leak Test",
        description: "Test for leaks",
        subSteps: [],
        stepType: "testing",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "SS304 Steel Sheet",
        quantity: "0.5",
        unit: "kg",
        costPerUnit: "300",
        supplier: "Steel Industries",
        notes: "Food grade stainless steel",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "Plastic Cap",
        quantity: "1",
        unit: "pieces",
        costPerUnit: "30",
        supplier: "Plastics Inc",
        notes: "BPA free polypropylene",
        usedInProcessStep: 2
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Leak Test",
        description: "Test water retention",
        checkType: "functional",
        acceptanceCriteria: "No leaks after 24 hours",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Seal integrity",
      tolerance: "100% leak-proof",
      inspectionImage: "",
      remarks: ""
    }
  },
  {
    type: "product",
    name: "Wooden Bookshelf",
    hsn: "94036090",
    unit: "pieces",
    category: "Furniture",
    code: "WBS-009",
    salePrice: "4500",
    salePriceTaxType: "with",
    saleDiscountType: "percentage",
    purchasePrice: "3200",
    purchasePriceTaxType: "without",
    taxRate: "18%",
    openingQty: "20",
    atPrice: "3200",
    asOfDate: new Date("2026-01-01"),
    minStock: "5",
    location: "Furniture Warehouse - Bay 3",
    currentStock: 20,
    processes: [
      {
        id: 1,
        stepName: "Wood Cutting",
        description: "Cut wooden planks to size",
        subSteps: [
          { id: 1, name: "Measure planks", description: "Mark cutting dimensions", status: "pending" },
          { id: 2, name: "Cut shelves", description: "Cut 5 shelves 90cm x 30cm", status: "pending" },
          { id: 3, name: "Cut sides", description: "Cut 2 side panels 180cm x 30cm", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Sanding",
        description: "Sand all surfaces",
        subSteps: [
          { id: 1, name: "Rough sanding", description: "80 grit sandpaper", status: "pending" },
          { id: 2, name: "Fine sanding", description: "180 grit sandpaper", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 3,
        stepName: "Assembly",
        description: "Assemble bookshelf",
        subSteps: [
          { id: 1, name: "Drill holes", description: "Drill for shelf pins", status: "pending" },
          { id: 2, name: "Install shelves", description: "Insert shelf pins and place shelves", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "Teak Wood Planks",
        quantity: "10",
        unit: "board feet",
        costPerUnit: "250",
        supplier: "Timber Traders",
        notes: "Seasoned teak wood",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "Shelf Pins",
        quantity: "20",
        unit: "pieces",
        costPerUnit: "5",
        supplier: "Hardware Co",
        notes: "Metal shelf support pins",
        usedInProcessStep: 3
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Stability Test",
        description: "Check shelf stability",
        checkType: "functional",
        acceptanceCriteria: "Each shelf holds 20kg without sagging",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Overall stability",
      tolerance: "No wobbling",
      inspectionImage: "",
      remarks: ""
    }
  },
  {
    type: "product",
    name: "Copper Wire Cable",
    hsn: "85444900",
    unit: "meters",
    category: "Electrical",
    code: "CWC-010",
    salePrice: "45",
    salePriceTaxType: "without",
    saleDiscountType: "percentage",
    purchasePrice: "32",
    purchasePriceTaxType: "without",
    taxRate: "18%",
    openingQty: "1000",
    atPrice: "32",
    asOfDate: new Date("2026-01-01"),
    minStock: "200",
    location: "Electrical Warehouse - Spool Rack",
    currentStock: 1000,
    processes: [
      {
        id: 1,
        stepName: "Wire Drawing",
        description: "Draw copper to required diameter",
        subSteps: [
          { id: 1, name: "Heat copper rod", description: "Heat to 600°C", status: "pending" },
          { id: 2, name: "Draw wire", description: "Draw to 2.5mm diameter", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Insulation",
        description: "Apply PVC insulation",
        subSteps: [
          { id: 1, name: "Extrude PVC", description: "Apply PVC coating", status: "pending" },
          { id: 2, name: "Cure coating", description: "Heat cure at 180°C", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "Copper Rod 8mm",
        quantity: "1.5",
        unit: "kg",
        costPerUnit: "18",
        supplier: "Copper Supplies Ltd",
        notes: "99.9% pure copper",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "PVC Compound",
        quantity: "200",
        unit: "grams",
        costPerUnit: "0.08",
        supplier: "Plastics Inc",
        notes: "Flame retardant grade",
        usedInProcessStep: 2
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Conductivity Test",
        description: "Test electrical conductivity",
        checkType: "functional",
        acceptanceCriteria: "Resistance < 0.01 ohm/meter",
        status: "pending"
      },
      {
        id: 2,
        checkName: "Insulation Test",
        description: "Test insulation integrity",
        checkType: "functional",
        acceptanceCriteria: "Withstand 2000V for 1 minute",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Wire diameter",
      tolerance: "2.5mm ±0.1mm",
      inspectionImage: "",
      remarks: ""
    }
  },
  {
    type: "product",
    name: "Glass Dining Table",
    hsn: "94036030",
    unit: "pieces",
    category: "Furniture",
    code: "GDT-011",
    salePrice: "8500",
    salePriceTaxType: "with",
    saleDiscountType: "flat",
    purchasePrice: "6200",
    purchasePriceTaxType: "without",
    taxRate: "18%",
    openingQty: "15",
    atPrice: "6200",
    asOfDate: new Date("2026-01-01"),
    minStock: "3",
    location: "Premium Furniture - Zone A",
    currentStock: 15,
    processes: [
      {
        id: 1,
        stepName: "Glass Cutting",
        description: "Cut tempered glass to size",
        subSteps: [
          { id: 1, name: "Measure glass", description: "150cm x 90cm", status: "pending" },
          { id: 2, name: "Cut glass", description: "Use glass cutter", status: "pending" },
          { id: 3, name: "Polish edges", description: "Smooth all edges", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Base Assembly",
        description: "Assemble metal base",
        subSteps: [
          { id: 1, name: "Weld base frame", description: "Weld steel tubes", status: "pending" },
          { id: 2, name: "Attach glass mounts", description: "Install rubber mounts", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "Tempered Glass 12mm",
        quantity: "1",
        unit: "sheet",
        costPerUnit: "4500",
        supplier: "Glass Works Ltd",
        notes: "Clear tempered glass",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "Steel Tube 40mm",
        quantity: "4",
        unit: "meters",
        costPerUnit: "150",
        supplier: "Steel Industries",
        notes: "Chrome plated steel",
        usedInProcessStep: 2
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Glass Quality",
        description: "Check for defects in glass",
        checkType: "visual",
        acceptanceCriteria: "No scratches, chips, or cracks",
        status: "pending"
      },
      {
        id: 2,
        checkName: "Weight Test",
        description: "Test load bearing capacity",
        checkType: "functional",
        acceptanceCriteria: "Support 100kg evenly distributed",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Table levelness",
      tolerance: "±2mm across surface",
      inspectionImage: "",
      remarks: ""
    }
  },
  {
    type: "product",
    name: "Ceramic Floor Tile",
    hsn: "69072200",
    unit: "boxes",
    category: "Building Materials",
    code: "CFT-012",
    salePrice: "850",
    salePriceTaxType: "without",
    saleDiscountType: "percentage",
    purchasePrice: "600",
    purchasePriceTaxType: "without",
    taxRate: "18%",
    openingQty: "100",
    atPrice: "600",
    asOfDate: new Date("2026-01-01"),
    minStock: "20",
    location: "Building Materials - Area 2",
    currentStock: 100,
    processes: [
      {
        id: 1,
        stepName: "Clay Preparation",
        description: "Prepare clay mixture",
        subSteps: [
          { id: 1, name: "Mix clay", description: "Mix clay with additives", status: "pending" },
          { id: 2, name: "Add water", description: "Achieve proper consistency", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Pressing",
        description: "Press tiles to shape",
        subSteps: [
          { id: 1, name: "Press clay", description: "High pressure molding", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 3,
        stepName: "Firing",
        description: "Fire in kiln",
        subSteps: [
          { id: 1, name: "Load kiln", description: "Arrange tiles in kiln", status: "pending" },
          { id: 2, name: "Fire at 1200°C", description: "Fire for 8 hours", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "Clay",
        quantity: "25",
        unit: "kg",
        costPerUnit: "15",
        supplier: "Clay Suppliers",
        notes: "High quality ceramic clay",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "Glaze",
        quantity: "2",
        unit: "kg",
        costPerUnit: "80",
        supplier: "Ceramic Materials Co",
        notes: "Matt finish glaze",
        usedInProcessStep: 3
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Size Check",
        description: "Verify tile dimensions",
        checkType: "measurement",
        acceptanceCriteria: "60cm x 60cm ±2mm",
        status: "pending"
      },
      {
        id: 2,
        checkName: "Surface Quality",
        description: "Check surface finish",
        checkType: "visual",
        acceptanceCriteria: "Uniform glaze, no cracks",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Flatness",
      tolerance: "±0.5mm",
      inspectionImage: "",
      remarks: "Box contains 4 tiles"
    }
  },
  {
    type: "product",
    name: "Laptop Backpack",
    hsn: "42021290",
    unit: "pieces",
    category: "Bags & Luggage",
    code: "LBP-013",
    salePrice: "1200",
    salePriceTaxType: "with",
    saleDiscountType: "percentage",
    purchasePrice: "720",
    purchasePriceTaxType: "without",
    taxRate: "18%",
    openingQty: "80",
    atPrice: "720",
    asOfDate: new Date("2026-01-01"),
    minStock: "20",
    location: "Accessories Warehouse - Shelf 7",
    currentStock: 80,
    processes: [
      {
        id: 1,
        stepName: "Cutting",
        description: "Cut fabric and foam padding",
        subSteps: [
          { id: 1, name: "Cut outer fabric", description: "Cut nylon fabric pieces", status: "pending" },
          { id: 2, name: "Cut padding", description: "Cut foam for laptop compartment", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Sewing",
        description: "Stitch all components",
        subSteps: [
          { id: 1, name: "Sew main body", description: "Assemble outer shell", status: "pending" },
          { id: 2, name: "Attach straps", description: "Sew shoulder straps", status: "pending" },
          { id: 3, name: "Install zippers", description: "Attach YKK zippers", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "Nylon Fabric 600D",
        quantity: "1.5",
        unit: "meters",
        costPerUnit: "180",
        supplier: "Textile Mills",
        notes: "Water resistant nylon",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "Foam Padding 10mm",
        quantity: "0.5",
        unit: "meters",
        costPerUnit: "120",
        supplier: "Foam Suppliers",
        notes: "High density foam",
        usedInProcessStep: 1
      },
      {
        id: 3,
        materialName: "YKK Zipper",
        quantity: "3",
        unit: "pieces",
        costPerUnit: "45",
        supplier: "Zipper Co",
        notes: "Heavy duty zippers",
        usedInProcessStep: 2
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Zipper Test",
        description: "Test zipper functionality",
        checkType: "functional",
        acceptanceCriteria: "Smooth operation, no jamming",
        status: "pending"
      },
      {
        id: 2,
        checkName: "Strap Strength",
        description: "Test strap attachment",
        checkType: "functional",
        acceptanceCriteria: "Hold 20kg load",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Stitch quality",
      tolerance: "No loose threads",
      inspectionImage: "",
      remarks: "Fits 15.6 inch laptop"
    }
  },
  {
    type: "product",
    name: "Hydraulic Car Jack",
    hsn: "84254290",
    unit: "pieces",
    category: "Automotive Tools",
    code: "HCJ-014",
    salePrice: "2800",
    salePriceTaxType: "without",
    saleDiscountType: "flat",
    purchasePrice: "1900",
    purchasePriceTaxType: "without",
    taxRate: "18%",
    openingQty: "40",
    atPrice: "1900",
    asOfDate: new Date("2026-01-01"),
    minStock: "10",
    location: "Tools Section - Rack 5",
    currentStock: 40,
    processes: [
      {
        id: 1,
        stepName: "Cylinder Machining",
        description: "Machine hydraulic cylinder",
        subSteps: [
          { id: 1, name: "Turn cylinder", description: "Lathe machine cylinder body", status: "pending" },
          { id: 2, name: "Bore interior", description: "Precision bore cylinder", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Assembly",
        description: "Assemble jack components",
        subSteps: [
          { id: 1, name: "Install piston", description: "Fit piston in cylinder", status: "pending" },
          { id: 2, name: "Attach handle", description: "Mount pump handle", status: "pending" },
          { id: 3, name: "Fill hydraulic oil", description: "Add hydraulic fluid", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 3,
        stepName: "Pressure Test",
        description: "Test hydraulic pressure",
        subSteps: [],
        stepType: "testing",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "Steel Cylinder",
        quantity: "1",
        unit: "pieces",
        costPerUnit: "800",
        supplier: "Precision Engineering",
        notes: "High tensile strength steel",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "Hydraulic Oil",
        quantity: "0.5",
        unit: "liters",
        costPerUnit: "200",
        supplier: "Oil Traders",
        notes: "ISO 32 hydraulic oil",
        usedInProcessStep: 2
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Lift Capacity Test",
        description: "Test maximum lift capacity",
        checkType: "functional",
        acceptanceCriteria: "Lift 2 tons safely",
        status: "pending"
      },
      {
        id: 2,
        checkName: "Leak Test",
        description: "Check for hydraulic leaks",
        checkType: "functional",
        acceptanceCriteria: "No leaks under pressure",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Lift height",
      tolerance: "330-450mm",
      inspectionImage: "",
      remarks: "2-ton capacity"
    }
  },
  {
    type: "product",
    name: "Solar Panel 150W",
    hsn: "85414090",
    unit: "pieces",
    category: "Renewable Energy",
    code: "SP150-015",
    salePrice: "6500",
    salePriceTaxType: "without",
    saleDiscountType: "percentage",
    purchasePrice: "4800",
    purchasePriceTaxType: "without",
    taxRate: "12%",
    openingQty: "25",
    atPrice: "4800",
    asOfDate: new Date("2026-01-01"),
    minStock: "5",
    location: "Solar Equipment - Bay 1",
    currentStock: 25,
    processes: [
      {
        id: 1,
        stepName: "Cell Assembly",
        description: "Assemble solar cells",
        subSteps: [
          { id: 1, name: "String cells", description: "Connect 36 cells in series", status: "pending" },
          { id: 2, name: "Test string", description: "Test voltage output", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 2,
        stepName: "Lamination",
        description: "Laminate panel",
        subSteps: [
          { id: 1, name: "Layer materials", description: "Glass, EVA, cells, backsheet", status: "pending" },
          { id: 2, name: "Vacuum laminate", description: "Laminate at 150°C", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      },
      {
        id: 3,
        stepName: "Frame Installation",
        description: "Attach aluminum frame",
        subSteps: [
          { id: 1, name: "Apply sealant", description: "Seal edges", status: "pending" },
          { id: 2, name: "Install frame", description: "Attach aluminum frame", status: "pending" }
        ],
        stepType: "execution",
        status: "pending"
      }
    ],
    rawMaterials: [
      {
        id: 1,
        materialName: "Solar Cells 4W",
        quantity: "36",
        unit: "pieces",
        costPerUnit: "110",
        supplier: "Solar Cell Imports",
        notes: "Monocrystalline cells 17% efficiency",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "Tempered Glass 3.2mm",
        quantity: "1",
        unit: "sheet",
        costPerUnit: "450",
        supplier: "Glass Works Ltd",
        notes: "Low iron tempered glass",
        usedInProcessStep: 2
      },
      {
        id: 3,
        materialName: "Aluminum Frame",
        quantity: "1",
        unit: "set",
        costPerUnit: "280",
        supplier: "Aluminum Traders",
        notes: "Anodized frame kit",
        usedInProcessStep: 3
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Power Output Test",
        description: "Test power generation",
        checkType: "functional",
        acceptanceCriteria: "Minimum 150W at STC",
        status: "pending"
      },
      {
        id: 2,
        checkName: "Insulation Test",
        description: "Test electrical insulation",
        checkType: "functional",
        acceptanceCriteria: "Withstand 1000V DC",
        status: "pending"
      }
    ],
    finalInspection: {
      parameter: "Voltage output",
      tolerance: "18V ±0.5V",
      inspectionImage: "",
      remarks: "25-year warranty"
    }
  }
];

async function seedItems() {
  try {
    console.log('🌱 Starting to seed items...');
    
    // Clear existing items (optional - comment out if you want to keep existing data)
    // await Item.deleteMany({});
    // console.log('🗑️  Cleared existing items');
    
    // Insert dummy items
    const result = await Item.insertMany(dummyItems);
    console.log(`✅ Successfully added ${result.length} dummy items`);
    
    // Display summary
    console.log('\n📦 Items Summary:');
    result.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (${item.code}) - ${item.type} - Stock: ${item.currentStock}`);
    });
    
    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding items:', error);
    process.exit(1);
  }
}

// Run the seed function
seedItems();
