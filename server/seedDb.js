const mongoose = require('mongoose');
const Item = require('./models/Item');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-oms';

const seedData = [
  {
    name: "Laptop Stickers",
    type: "product",
    category: "Stickers & Labels",
    hsn: "4911.91",
    code: "LSTICKER-001",
    unit: "Piece",
    salePrice: "25",
    salePriceTaxType: "without",
    saleDiscountType: "percentage",
    purchasePrice: "8",
    purchasePriceTaxType: "without",
    taxRate: "5",
    openingQty: "1000",
    atPrice: "8",
    minStock: "100",
    location: "Shelf-A1",
    currentStock: 1000,
    rawMaterials: [
      {
        id: 1,
        materialName: "Vinyl Sticker Sheet",
        quantity: "500",
        unit: "Sheets",
        costPerUnit: "3",
        supplier: "Sticker Supplies Ltd",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "CMYK Ink Cartridges",
        quantity: "2",
        unit: "Sets",
        costPerUnit: "2",
        supplier: "Ink Distributors",
        usedInProcessStep: 2
      },
      {
        id: 3,
        materialName: "Lamination Film",
        quantity: "100",
        unit: "Meters",
        costPerUnit: "1.5",
        supplier: "Packaging Supplies",
        usedInProcessStep: 4
      },
      {
        id: 4,
        materialName: "Die-Cut Machine Blades",
        quantity: "1",
        unit: "Set",
        costPerUnit: "50",
        supplier: "Equipment Supplier",
        usedInProcessStep: 5
      }
    ],
    processes: [
      {
        id: 1,
        stepName: "Material Preparation",
        description: "Prepare and organize vinyl sticker sheets for printing",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Unpack vinyl sheets",
            description: "Remove vinyl sheets from packaging and inspect for damage",
            status: "pending"
          },
          {
            id: 2,
            name: "Clean sheet surface",
            description: "Clean sheets with anti-static cloth to remove dust",
            status: "pending"
          }
        ]
      },
      {
        id: 2,
        stepName: "Design Loading",
        description: "Load and verify design files in printing software",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Import design file",
            description: "Import laptop sticker design into printing software",
            status: "pending"
          },
          {
            id: 2,
            name: "Verify color profile",
            description: "Ensure CMYK color profile is correctly set",
            status: "pending"
          }
        ]
      },
      {
        id: 3,
        stepName: "Digital Printing",
        description: "Print designs on vinyl sheets using CMYK printer",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Load ink cartridges",
            description: "Install CMYK ink cartridges in printer",
            status: "pending"
          },
          {
            id: 2,
            name: "Execute print job",
            description: "Run print job for 500 stickers with optimal resolution",
            status: "pending"
          }
        ]
      },
      {
        id: 4,
        stepName: "Drying Process",
        description: "Allow printed sheets to dry completely",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Move to drying rack",
            description: "Transfer printed sheets to ventilated drying rack",
            status: "pending"
          },
          {
            id: 2,
            name: "Monitor drying time",
            description: "Ensure minimum 2-3 hours drying in controlled temperature",
            status: "pending"
          }
        ]
      },
      {
        id: 5,
        stepName: "Lamination Application",
        description: "Apply protective lamination film to printed sheets",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Feed into laminator",
            description: "Insert dried sheets into lamination machine",
            status: "pending"
          },
          {
            id: 2,
            name: "Apply protective layer",
            description: "Run through laminator with protective film on both sides",
            status: "pending"
          }
        ]
      },
      {
        id: 6,
        stepName: "Cooling & Setting",
        description: "Cool laminated sheets to set adhesive properly",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Transfer to cooling zone",
            description: "Move laminated sheets to cooling conveyor",
            status: "pending"
          },
          {
            id: 2,
            name: "Set and solidify",
            description: "Allow 30-45 minutes for lamination adhesive to fully set",
            status: "pending"
          }
        ]
      },
      {
        id: 7,
        stepName: "Die-Cutting",
        description: "Cut individual stickers from laminated sheets using die-cut machine",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Setup die-cut machine",
            description: "Install laptop sticker die and calibrate cutting depth",
            status: "pending"
          },
          {
            id: 2,
            name: "Execute cutting operation",
            description: "Run die-cut machine to separate individual stickers",
            status: "pending"
          }
        ]
      },
      {
        id: 8,
        stepName: "Edge Trimming",
        description: "Trim excess material and smooth edges of individual stickers",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Manual edge inspection",
            description: "Inspect each sticker edge for rough spots or excess material",
            status: "pending"
          },
          {
            id: 2,
            name: "Edge smoothing",
            description: "Use sanding or buffing to smooth any rough edges",
            status: "pending"
          }
        ]
      },
      {
        id: 9,
        stepName: "Quality Inspection",
        description: "Inspect stickers for defects, color accuracy, and dimensions",
        stepType: "testing",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Visual defect check",
            description: "Check for print defects, smudges, or discoloration",
            status: "pending"
          },
          {
            id: 2,
            name: "Dimensional verification",
            description: "Measure samples to ensure accurate die-cutting dimensions",
            status: "pending"
          }
        ]
      },
      {
        id: 10,
        stepName: "Packaging & Labeling",
        description: "Package stickers into units and apply labels for distribution",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Count and batch",
            description: "Count stickers into batches of 100 per pack",
            status: "pending"
          },
          {
            id: 2,
            name: "Apply product labels",
            description: "Affix product label with SKU, batch number, and date",
            status: "pending"
          }
        ]
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Print Quality",
        description: "Verify print clarity and color accuracy",
        checkType: "visual",
        acceptanceCriteria: "No visible print defects, accurate color reproduction",
        status: "pending"
      },
      {
        id: 2,
        checkName: "Dimension Check",
        description: "Verify sticker dimensions match specifications",
        checkType: "measurement",
        acceptanceCriteria: "±0.5mm tolerance",
        status: "pending"
      },
      {
        id: 3,
        checkName: "Adhesive Test",
        description: "Test sticker adhesive strength and removability",
        checkType: "functional",
        acceptanceCriteria: "Sticks securely, removes without residue",
        status: "pending"
      }
    ]
  },
  {
    name: "VP7 Front Panel Stickers",
    type: "product",
    category: "Electronics - Panel Labels",
    hsn: "3919.10",
    code: "VP7FPS-001",
    unit: "Piece",
    salePrice: "45",
    salePriceTaxType: "without",
    saleDiscountType: "percentage",
    purchasePrice: "15",
    purchasePriceTaxType: "without",
    taxRate: "5",
    openingQty: "500",
    atPrice: "15",
    minStock: "50",
    location: "Shelf-B2",
    currentStock: 500,
    rawMaterials: [
      {
        id: 1,
        materialName: "PET Film Substrate",
        quantity: "100",
        unit: "Sheets",
        costPerUnit: "4",
        supplier: "Polymer Films Inc",
        usedInProcessStep: 1
      },
      {
        id: 2,
        materialName: "Specialty Printing Inks",
        quantity: "3",
        unit: "Bottles",
        costPerUnit: "8",
        supplier: "Advanced Inks Ltd",
        usedInProcessStep: 3
      },
      {
        id: 3,
        materialName: "Heat-Resistant Adhesive",
        quantity: "500",
        unit: "ml",
        costPerUnit: "2",
        supplier: "Adhesive Solutions",
        usedInProcessStep: 6
      },
      {
        id: 4,
        materialName: "Silicone Release Paper",
        quantity: "50",
        unit: "Sheets",
        costPerUnit: "1",
        supplier: "Release Paper Co",
        usedInProcessStep: 7
      },
      {
        id: 5,
        materialName: "UV Protective Topcoat",
        quantity: "2",
        unit: "Liters",
        costPerUnit: "5",
        supplier: "Coatings Premium",
        usedInProcessStep: 8
      }
    ],
    processes: [
      {
        id: 1,
        stepName: "Substrate Preparation",
        description: "Prepare and clean PET film substrate for high-precision printing",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Unroll PET film",
            description: "Carefully unroll PET film and secure on printing frame",
            status: "pending"
          },
          {
            id: 2,
            name: "Surface cleaning",
            description: "Clean substrate with ionized air to remove static and dust",
            status: "pending"
          }
        ]
      },
      {
        id: 2,
        stepName: "Design Registration",
        description: "Register VP7 panel design with precise alignment marks",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Load design template",
            description: "Load VP7 front panel design into registration system",
            status: "pending"
          },
          {
            id: 2,
            name: "Alignment verification",
            description: "Verify alignment marks and registration points",
            status: "pending"
          }
        ]
      },
      {
        id: 3,
        stepName: "Precision Screen Printing",
        description: "Apply multi-color printing using precision screen printing technique",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Setup color stations",
            description: "Setup 4-color screen printing stations with specialty inks",
            status: "pending"
          },
          {
            id: 2,
            name: "Execute color separation",
            description: "Print each color layer with precision registration",
            status: "pending"
          }
        ]
      },
      {
        id: 4,
        stepName: "Ink Curing",
        description: "Cure printed inks at controlled temperature for proper adhesion",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Move to UV curing tunnel",
            description: "Transfer printed substrate through UV curing tunnel",
            status: "pending"
          },
          {
            id: 2,
            name: "Temperature control",
            description: "Monitor curing at 80-120°C for 5-10 minutes",
            status: "pending"
          }
        ]
      },
      {
        id: 5,
        stepName: "Cooling & Stabilization",
        description: "Cool printed substrate and stabilize ink adhesion",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Cool on conveyor",
            description: "Move substrate through cooling conveyor system",
            status: "pending"
          },
          {
            id: 2,
            name: "Ink hardening",
            description: "Allow 1-2 hours for complete ink hardening and adhesion",
            status: "pending"
          }
        ]
      },
      {
        id: 6,
        stepName: "Heat-Resistant Adhesive Application",
        description: "Apply specially formulated heat-resistant adhesive backing",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Prepare adhesive batch",
            description: "Mix heat-resistant adhesive with proper viscosity",
            status: "pending"
          },
          {
            id: 2,
            name: "Apply adhesive coating",
            description: "Apply uniform adhesive layer using precision applicator",
            status: "pending"
          }
        ]
      },
      {
        id: 7,
        stepName: "Release Paper Application",
        description: "Apply silicone release paper to protect adhesive layer",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Cut release paper",
            description: "Cut silicone release paper to match substrate size",
            status: "pending"
          },
          {
            id: 2,
            name: "Apply release layer",
            description: "Laminate release paper onto adhesive backing",
            status: "pending"
          }
        ]
      },
      {
        id: 8,
        stepName: "UV Protective Topcoat",
        description: "Apply UV protective topcoat for durability and color protection",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Prepare topcoat",
            description: "Mix UV protective topcoat to proper consistency",
            status: "pending"
          },
          {
            id: 2,
            name: "Apply protective coating",
            description: "Apply even topcoat layer for UV and moisture protection",
            status: "pending"
          }
        ]
      },
      {
        id: 9,
        stepName: "Quality Testing & Inspection",
        description: "Perform comprehensive quality tests and dimensional verification",
        stepType: "testing",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Print registration check",
            description: "Verify color registration accuracy and alignment",
            status: "pending"
          },
          {
            id: 2,
            name: "Adhesive strength test",
            description: "Test adhesive strength under various temperatures",
            status: "pending"
          }
        ]
      },
      {
        id: 10,
        stepName: "Die-Cutting & Packaging",
        description: "Cut individual stickers and package for distribution",
        stepType: "execution",
        status: "pending",
        subSteps: [
          {
            id: 1,
            name: "Die-cut to shape",
            description: "Cut stickers to VP7 panel contour specifications",
            status: "pending"
          },
          {
            id: 2,
            name: "Final packaging",
            description: "Package into protective sleeves with batch labeling",
            status: "pending"
          }
        ]
      }
    ],
    inspectionChecks: [
      {
        id: 1,
        checkName: "Color Accuracy",
        description: "Verify VP7 panel colors match specification pantone",
        checkType: "visual",
        acceptanceCriteria: "Within ΔE<2 color tolerance",
        status: "pending"
      },
      {
        id: 2,
        checkName: "Registration Precision",
        description: "Check color layer alignment and registration",
        checkType: "measurement",
        acceptanceCriteria: "±0.2mm registration tolerance",
        status: "pending"
      },
      {
        id: 3,
        checkName: "Heat Resistance Test",
        description: "Test sticker durability at elevated temperatures",
        checkType: "functional",
        acceptanceCriteria: "Maintains adhesion and clarity at 60°C for 1 hour",
        status: "pending"
      },
      {
        id: 4,
        checkName: "Adhesive Peel Test",
        description: "Test adhesive strength after thermal stress",
        checkType: "functional",
        acceptanceCriteria: "No peeling, adhesive strength > 2N/25mm",
        status: "pending"
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);

    console.log('Connected to MongoDB successfully');

    // Check if items already exist
    const existingItems = await Item.find({ code: { $in: ['LSTICKER-001', 'VP7FPS-001'] } });

    if (existingItems.length > 0) {
      console.log(`⚠️  ${existingItems.length} item(s) already exist. Removing duplicates...`);
      await Item.deleteMany({ code: { $in: ['LSTICKER-001', 'VP7FPS-001'] } });
      console.log('Previous items deleted.');
    }

    // Insert seed data
    const insertedItems = await Item.insertMany(seedData);

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`\n📦 Inserted ${insertedItems.length} items:`);
    insertedItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} (Code: ${item.code})`);
    });

    // Display details
    console.log('\n📋 Item Details:');
    insertedItems.forEach((item) => {
      console.log(`\n   Item: ${item.name}`);
      console.log(`   - Code: ${item.code}`);
      console.log(`   - Category: ${item.category}`);
      console.log(`   - Sale Price: ₹${item.salePrice}`);
      console.log(`   - Manufacturing Steps: ${item.processes.length}`);
      console.log(`   - Raw Materials: ${item.rawMaterials.length}`);
      console.log(`   - Inspection Checks: ${item.inspectionChecks.length}`);
      console.log(`   - Opening Stock: ${item.openingQty} units`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

// Run seed function
seedDatabase();
