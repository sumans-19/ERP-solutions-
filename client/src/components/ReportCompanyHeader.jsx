import React from 'react';

const ReportCompanyHeader = () => {
    return (
        <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8 w-full">
            {/* Logo Section */}
            <div className="flex-shrink-0">
                <img
                    src="/company_logo.png"
                    alt="ADHISHAKTI GROUP Logo"
                    className="h-20 w-auto object-contain"
                />
            </div>

            {/* Company Info Section */}
            <div className="text-right flex-grow pl-8">

                <div className="text-[10px] text-slate-600 space-y-0.5 leading-relaxed">
                    <p className="font-medium">#60, 13th Main, Bhogadi, Mysore – 570 026, Karnataka, India</p>
                    <p>
                        <span className="font-bold">Email:</span> printings@adhishaktigroups.com, info@adhishaktigroups.com
                    </p>
                    <div className="flex justify-end gap-4">
                        <p><span className="font-bold">Phone:</span> +91 821 259 8078</p>
                        <p><span className="font-bold">Mobile:</span> +91 9535 77 4444</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportCompanyHeader;
